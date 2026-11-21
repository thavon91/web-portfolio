import { privateAssetUrl } from "../../privateAssets.js";
import * as THREE from "three";
import { DEFAULT_CRATERS, overlapsCrater } from "./crater_collisions.js";
import { Octree } from "three/examples/jsm/math/Octree.js";

import {
    GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";

import {
    DRACOLoader,
} from "three/examples/jsm/loaders/DRACOLoader.js";

const collisionSourceUrl = privateAssetUrl("source-model/map_collision.glb");


// ============================================================
// CREATE MAP COLLISION
// ============================================================

export function createMapCollision({
    scene,
}) {

    const root =
        new THREE.Group();

    root.name =
        "MapCollisionDebug";


    // Hidden initially.
    root.visible =
        false;


    scene.add(
        root
    );


    const settings = { enabled: true, cratersEnabled: true, color: "#aaaaaa", opacity: 1, throughWalls: true };
    const craters = [];
    const craterDebug = new THREE.Group();
    root.add(craterDebug);
    const categories = { ditches: true, walls: true, rocks: true, jars: true, bombs: false, ground: true, other: true, craters: true };
    function updateCraterDebug() {
        for (const [index, line] of craterDebug.children.entries()) {
            const crater = craters[index];
            line.position.set(crater.x, crater.y + 0.02, crater.z);
            line.scale.set(crater.radius, 1, crater.radius);
        }
        applyDebugStyle();
    }
    function collisionCategory(name) {
        const lower = name.toLowerCase();
        if (lower.includes("field_ditch")) return "ditches";
        if (lower.includes("full_wall_stone")) return "walls";
        if (lower.includes("rock") || lower.includes("stone")) return "rocks";
        if (lower.includes("jar")) return "jars";
        if (lower.includes("bomb")) return "bombs";
        if (lower.includes("map_level")) return "ground";
        return "other";
    }
    function applyDebugStyle() {
        root.traverse((object) => {
            if (!object.isLine) return;
            object.visible = !object.userData.destroyed && (categories[object.userData.collisionCategory] ?? true);
            object.material.color.set(settings.color);
            object.material.opacity = settings.opacity;
            object.material.depthTest = !settings.throughWalls;
            object.material.needsUpdate = true;
        });
    }
    let loaded = false;
    const readyCallbacks = [];
    const obstacles = [];
    const localPoint = new THREE.Vector3();
    const groundRay = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
    let groundOctree;
    let groundTop = 0;

    function groundAt(x, z) {
        if (!groundOctree) return null;
        groundRay.origin.set(x, groundTop, z);
        return groundOctree.rayIntersect(groundRay)?.position.y ?? null;
    }

    function canOccupy(x, z, feetY, radius, height, enforceObstacles = false) {
        if (!loaded) return false;
        if (settings.cratersEnabled && overlapsCrater(craters, x, z, radius)) return false;
        if (!settings.enabled && !enforceObstacles) return true;
        return !obstacles.some(({ box, localBox, inverse, radiusScale, boundaryWall }) => {
            if (!boundaryWall && (box.max.y <= feetY + 0.025 || box.min.y >= feetY + height)) return false;
            const dx = x - THREE.MathUtils.clamp(x, box.min.x, box.max.x);
            const dz = z - THREE.MathUtils.clamp(z, box.min.z, box.max.z);
            if (dx * dx + dz * dz >= radius * radius) return false;
            // The outer stones are the map boundary. Never let the ground
            // sampler treat the top of one as walkable floor.
            if (boundaryWall) return true;
            // The world AABB is only a broad check. Rotated rocks have large
            // empty corners; test against their local box before blocking.
            localPoint.set(x, feetY + height * 0.5, z).applyMatrix4(inverse);
            const localRadius = radius * radiusScale;
            const localDx = localPoint.x - THREE.MathUtils.clamp(localPoint.x, localBox.min.x, localBox.max.x);
            const localDz = localPoint.z - THREE.MathUtils.clamp(localPoint.z, localBox.min.z, localBox.max.z);
            return localDx * localDx + localDz * localDz < localRadius * localRadius;
        });
    }

    let loading = false;


    // ==========================================================
    // LOAD
    // ==========================================================

    async function load() {

        if (loaded) {
            return root;
        }


        if (loading) {
            return root;
        }


        loading = true;


        // --------------------------------------------------------
        // Draco
        // --------------------------------------------------------

        const dracoLoader =
            new DRACOLoader();

        dracoLoader.setDecoderPath(
            `${import.meta.env.BASE_URL}draco/`
        );


        // --------------------------------------------------------
        // GLTF loader
        // --------------------------------------------------------

        const loader =
            new GLTFLoader();

        loader.setDRACOLoader(
            dracoLoader
        );


        try {

            const gltf =
                await new Promise(
                    (resolve, reject) => {

                        loader.load(

                            collisionSourceUrl,

                            resolve,

                            undefined,

                            reject

                        );
                    }
                );


            const collisionModel =
                gltf.scene;


            collisionModel.name =
                "MapCollisionGeometry";
            collisionModel.updateMatrixWorld(true);
            const floor = collisionModel.getObjectByName("map_level_collision");
            if (!floor) throw new Error("Collision floor was not found.");
            groundTop = new THREE.Box3().setFromObject(floor).max.y + 1;
            groundOctree = new Octree().fromGraphNode(floor);
            craters.push(...DEFAULT_CRATERS.map((crater) => ({ ...crater,
                y: groundAt(crater.x + crater.radius + 0.1, crater.z) ?? 0.67 })));
            for (const [index] of craters.entries()) {
                const points = Array.from({ length: 64 }, (_, i) => new THREE.Vector3(Math.cos(i * Math.PI / 32), 0, Math.sin(i * Math.PI / 32)));
                const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),
                    new THREE.LineBasicMaterial({ color: settings.color, transparent: true, depthWrite: false }));
                line.name = `Crater_${index + 1}_Collision`;
                line.userData.collisionCategory = "craters";
                line.renderOrder = 9999;
                craterDebug.add(line);
            }
            updateCraterDebug();
            obstacles.length = 0;
            collisionModel.traverse((child) => {
                if (child.isMesh && !child.name.toLowerCase().includes("map_level")) {
                    // Embedded GLB bombs are source assets, not gameplay
                    // obstacles. Runtime player bombs handle their own blocking.
                    if (collisionCategory(child.name) === "bombs") return;
                    child.geometry.computeBoundingBox();
                    const scale = child.getWorldScale(new THREE.Vector3());
                    obstacles.push({
                        name: child.name,
                        box: new THREE.Box3().setFromObject(child),
                        localBox: child.geometry.boundingBox.clone(),
                        inverse: child.matrixWorld.clone().invert(),
                        radiusScale: 1 / Math.min(Math.abs(scale.x), Math.abs(scale.z)),
                        boundaryWall: child.name.toLowerCase().includes("full_wall_stone"),
                    });
                }
            });


            // ======================================================
            // CREATE GRAY WIREFRAME
            // ======================================================

            collisionModel.traverse(
                (child) => {

                    if (!child.isMesh) {
                        return;
                    }


                    const geometry =
                        new THREE.WireframeGeometry(
                            child.geometry
                        );


                    const material =
                        new THREE.LineBasicMaterial({

                            // Gray
                            color: 0xaaaaaa,

                            transparent: true,

                            opacity: 1.0,

                            // Visible through map
                            depthTest: false,

                            depthWrite: false,

                        });


                    const wireframe =
                        new THREE.LineSegments(
                            geometry,
                            material
                        );
                    wireframe.userData.collisionCategory = collisionCategory(child.name);


                    wireframe.name =
                        `${child.name ||
                        "Collision"
                        }_Wireframe`;


                    // Keep original transform.
                    wireframe.position.copy(
                        child.position
                    );


                    wireframe.quaternion.copy(
                        child.quaternion
                    );


                    wireframe.scale.copy(
                        child.scale
                    );


                    wireframe.renderOrder =
                        9999;


                    // Add wireframe to same
                    // parent as collision mesh.
                    if (child.parent) {

                        child.parent.add(
                            wireframe
                        );
                    }


                    // Hide original collision mesh.
                    child.visible =
                        false;
                }
            );


            root.add(
                collisionModel
            );
            applyDebugStyle();


            loaded = true;
            readyCallbacks.splice(0).forEach((callback) => callback());

            loading = false;


            dracoLoader.dispose();


            console.log(
                "Map collision loaded."
            );


            return root;

        } catch (error) {

            loading = false;


            console.error(
                "Map collision error:",
                error
            );


            throw error;
        }
    }


    // ==========================================================
    // SHOW
    // ==========================================================

    function show() {

        root.visible =
            true;
    }


    // ==========================================================
    // HIDE
    // ==========================================================

    function hide() {

        root.visible =
            false;
    }


    // ==========================================================
    // TOGGLE
    // ==========================================================

    function toggle() {

        root.visible =
            !root.visible;


        console.log(
            `Map collision: ${root.visible
                ? "VISIBLE"
                : "HIDDEN"
            }`
        );


        return root.visible;
    }


    // ==========================================================
    // VISIBILITY
    // ==========================================================

    function isVisible() {

        return root.visible;
    }


    // ==========================================================
    // DISPOSE
    // ==========================================================

    function dispose() {

        root.traverse(
            (object) => {

                if (
                    object.isLine
                ) {

                    object.geometry?.dispose();

                    object.material?.dispose();
                }
            }
        );


        scene.remove(
            root
        );
    }


    function removeObstacle(name) {
        const normalize = (value) => value.replace(/_collision$/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
        const target = normalize(name);
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (normalize(obstacles[i].name) === target) obstacles.splice(i, 1);
        }
        root.traverse((object) => {
            if (object.isLineSegments && normalize(object.name.replace(/_Wireframe$/, "")) === target) {
                object.userData.destroyed = true;
                object.visible = false;
            }
        });
    }
    function obstacleAt(x, z) {
        if (settings.cratersEnabled && overlapsCrater(craters, x, z)) return { name: "crater_boundary" };
        const hits = obstacles.filter(({ box }) => x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z);
        return hits.find(({ name }) => !name.toLowerCase().includes("field_ditch")) ?? hits[0] ?? null;
    }
    // ==========================================================
    // PUBLIC API
    // ==========================================================

    return {

        root,
        removeObstacle,
        obstacleAt,
        settings,
        categories,
        craters,
        updateCraterDebug,
        onLoaded(callback) { if (loaded) callback(); else readyCallbacks.push(callback); },
        applyDebugStyle,
        get loaded() { return loaded; },
        get obstacleCount() { return obstacles.length; },

        load,
        canOccupy,
        groundAt,

        show,

        hide,

        toggle,

        isVisible,

        dispose,

    };
}
