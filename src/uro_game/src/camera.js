import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CAMERA_FOV = 50;
const CAMERA_VIEW_DIRECTION = new THREE.Vector3(0, 0.38, -0.92).normalize();
const CAMERA_PADDING = 0.72;
const CAMERA_VERTICAL_FRAME_OFFSET = -0.04;
const START_CAMERA_TRANSFORM = {
    x: 3.13399,
    y: 4.88293,
    z: -2.7163,
    rotationX: -138.652,
    rotationY: -0.46183,
    rotationZ: -179.593,
    distance: 5.14119,
    fov: 50,
};

// Set to "manual" to use the transform values below.
const CAMERA_MODE = "auto";

// Three.js axes: X = left/right, Y = height, Z = forward/back.
const MANUAL_CAMERA_TRANSFORM = {
    position: { x: 0.4, y: 4, z: -5 },
    // Degrees, matching the familiar Blender Transform display.
    rotationDegrees: { x: 40, y: 180, z: 0 },
};

export function createBoardCamera({ renderer, getBoard }) {
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 500);
    const target = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const controls = new OrbitControls(camera, renderer.domElement);
    const changeListeners = new Set();
    const followPoint = new THREE.Vector3();
    const followDelta = new THREE.Vector3();
    let followTarget = null;
    let followEnabled = false;
    let startupViewApplied = false;
    // Keep programmatic camera framing and following, but lock mouse/touch controls.
    controls.enabled = false;
    function notifyChange() {
        for (const listener of changeListeners) listener();
    }
    controls.addEventListener("change", notifyChange);

    function getFollowPoint() {
        followTarget.getWorldPosition(followPoint);
        followPoint.y += 0.25;
        return followPoint;
    }

    function setFollowEnabled(enabled) {
        followEnabled = Boolean(enabled && followTarget);
        if (followEnabled) {
            // Translate the camera and its aim together, preserving angle and zoom.
            followDelta.copy(getFollowPoint()).sub(controls.target);
            camera.position.add(followDelta);
            controls.target.add(followDelta);
            controls.update();
        }
        notifyChange();
    }

    function setFollowTarget(object, enabled = true) {
        followTarget = object;
        setFollowEnabled(Boolean(object) && enabled);
    }

    function getTransform() {
        return {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            rotationX: THREE.MathUtils.radToDeg(camera.rotation.x),
            rotationY: THREE.MathUtils.radToDeg(camera.rotation.y),
            rotationZ: THREE.MathUtils.radToDeg(camera.rotation.z),
            distance: camera.position.distanceTo(controls.target),
            fov: camera.fov,
        };
    }

    function setTransform(transform, zoom = false) {
        if (!zoom && !followEnabled) camera.position.set(transform.x, transform.y, transform.z);
        camera.rotation.set(
            THREE.MathUtils.degToRad(transform.rotationX),
            THREE.MathUtils.degToRad(transform.rotationY),
            THREE.MathUtils.degToRad(transform.rotationZ),
            "XYZ",
        );
        camera.updateMatrixWorld();
        forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        if (followEnabled) {
            controls.target.copy(getFollowPoint());
            camera.position.copy(controls.target).addScaledVector(forward, -transform.distance);
        } else if (zoom) {
            camera.position.copy(controls.target).addScaledVector(forward, -transform.distance);
        } else {
            controls.target.copy(camera.position).addScaledVector(forward, transform.distance);
        }
        camera.fov = transform.fov;
        camera.updateProjectionMatrix();
        controls.update();
    }

    function applyManualTransform() {
        const { position, rotationDegrees } = MANUAL_CAMERA_TRANSFORM;

        camera.position.set(position.x, position.y, position.z);
        camera.rotation.set(
            THREE.MathUtils.degToRad(rotationDegrees.x),
            THREE.MathUtils.degToRad(rotationDegrees.y),
            THREE.MathUtils.degToRad(rotationDegrees.z),
            "XYZ",
        );
        camera.near = 0.1;
        camera.far = 500;
        camera.updateProjectionMatrix();
    }

    function frameBoard(object) {
        if (followEnabled) setFollowEnabled(false);
        if (CAMERA_MODE === "manual") {
            applyManualTransform();
            return;
        }

        const box = new THREE.Box3().setFromObject(object);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        box.getCenter(target);

        camera.aspect = window.innerWidth / window.innerHeight;

        const verticalFov = THREE.MathUtils.degToRad(camera.fov);
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
        const fitFov = Math.min(verticalFov, horizontalFov);
        const padding = camera.aspect < 1 ? 0.9 : CAMERA_PADDING;
        const distance = (sphere.radius * padding) / Math.sin(fitFov / 2);

        camera.position.copy(target).addScaledVector(CAMERA_VIEW_DIRECTION, distance);
        camera.near = 0.1;
        camera.far = distance + sphere.radius * 3 + 50;
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        camera.projectionMatrix.elements[9] = CAMERA_VERTICAL_FRAME_OFFSET;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        controls.target.copy(target);
        controls.update();
        if (!startupViewApplied) {
            startupViewApplied = true;
            setTransform(START_CAMERA_TRANSFORM);
        }
    }

    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;

        const board = getBoard();
        if (board && board.children.length && !startupViewApplied) {
            frameBoard(board);
            return;
        }

        camera.updateProjectionMatrix();
    }

    window.addEventListener("resize", handleResize);

    function update() {
        controls.update();
        if (!followEnabled) return;
        followDelta.copy(getFollowPoint()).sub(controls.target);
        camera.position.add(followDelta);
        controls.target.add(followDelta);
        controls.update();
    }

    return {
        camera,
        frameBoard,
        getTransform,
        setTransform,
        setFollowTarget,
        setFollowEnabled,
        isFollowing: () => followEnabled,
        onChange(listener) {
            changeListeners.add(listener);
            return () => changeListeners.delete(listener);
        },
        update,
        dispose() {
            window.removeEventListener("resize", handleResize);
            changeListeners.clear();
            controls.dispose();
        },
    };
}
