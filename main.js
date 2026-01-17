import * as THREE from './three/src/Three.js';
import WebGPURenderer from './three/src/renderers/webgpu/WebGPURenderer.js';
import MeshStandardNodeMaterial from './three/src/materials/nodes/MeshStandardNodeMaterial.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

async function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);

    const renderer = new WebGPURenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(renderer.domElement);
    await renderer.init();

    // --- Camera fixed view ---
    const fixedPosition = new THREE.Vector3(-1.595, 0.379, 2.255);
    const fixedLookAt = new THREE.Vector3(2, -0.2, 0);
    camera.position.copy(fixedPosition);
    camera.lookAt(fixedLookAt);

    // --- Toggle controls ---
    const toggleBtn = document.getElementById("toggleControlsBtn");
    let controls = null;
    let controlsEnabled = false;
    const togglePosition = new THREE.Vector3(-3, 1, 3);
    const toggleLookAt = new THREE.Vector3(0, 0, 0);

    function smoothMoveCamera(targetPos, targetLookAt, duration = 1000, onComplete) {
        const startPos = camera.position.clone();
        const startLook = new THREE.Vector3();
        camera.getWorldDirection(startLook).add(camera.position);
        let startTime = performance.now();

        function update() {
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            camera.position.lerpVectors(startPos, targetPos, t);
            const look = new THREE.Vector3().lerpVectors(startLook, targetLookAt, t);
            camera.lookAt(look);

            if (t < 1) requestAnimationFrame(update);
            else if (onComplete) onComplete();
        }

        update();
    }

    toggleBtn.addEventListener("click", () => {
        if (controlsEnabled) {
            if (controls) { controls.dispose(); controls = null; }
            controlsEnabled = false;
            smoothMoveCamera(fixedPosition, fixedLookAt, 1500);
        } else {
            controlsEnabled = true;
            smoothMoveCamera(togglePosition, toggleLookAt, 1500, () => {
                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.target.copy(toggleLookAt);
                controls.update();
            });
        }
    });

    // --- Learn & Back Buttons ---
    const contentDiv = document.getElementById("content");
    const rightDiv = document.querySelector(".right");
    const learnBtn = document.getElementById("learnBtn");

    const frontPOV = camera.position.clone();
    const frontLookAt = fixedLookAt.clone();
    const learnPOV = new THREE.Vector3(-3, 1, 3);
    const learnLookAt = new THREE.Vector3(0, 0, 0);

    function animateCameraCurve(camera, fromPos, toPos, duration = 1200, rotateEarth = true) {
        const startTime = performance.now();
        const midPoint = fromPos.clone().lerp(toPos, 0.5);
        midPoint.y += 1.2;

        function frame(time) {
            const elapsed = time - startTime;
            const t = Math.min(elapsed / duration, 1);

            camera.position.set(
                (1 - t) ** 2 * fromPos.x + 2 * (1 - t) * t * midPoint.x + t ** 2 * toPos.x,
                (1 - t) ** 2 * fromPos.y + 2 * (1 - t) * t * midPoint.y + t ** 2 * toPos.y,
                (1 - t) ** 2 * fromPos.z + 2 * (1 - t) * t * midPoint.z + t ** 2 * toPos.z
            );

            const lookAt = new THREE.Vector3().lerpVectors(frontLookAt, learnLookAt, t);
            camera.lookAt(lookAt);

            if (rotateEarth && typeof earth !== 'undefined') earth.rotation.y += 0.005;

            if (t < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    learnBtn.addEventListener("click", () => {
        contentDiv.classList.add("fade-out");
        rightDiv.classList.add("fade-out");

        animateCameraCurve(camera, frontPOV, learnPOV, 1200);

        contentDiv.addEventListener("transitionend", function handler() {
            contentDiv.removeEventListener("transitionend", handler);

            contentDiv.innerHTML = `
                <div id="learnContent" class="learn-container">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/salY_Sm6mv4?si=Xxfa1QNCqQLIzjp2" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

                <button class="btn" id="back-btn">Back</button>
            `;
            rightDiv.style.display = "none";
            requestAnimationFrame(() => contentDiv.classList.remove("fade-out"));

            const backBtn = document.getElementById("back-btn");
            backBtn.addEventListener("click", () => {
                contentDiv.classList.add("fade-out");

                contentDiv.addEventListener("transitionend", function backHandler() {
                    contentDiv.removeEventListener("transitionend", backHandler);

                    animateCameraCurve(camera, learnPOV, frontPOV, 1200);

                    contentDiv.innerHTML = `
                        <h1>Welcome To Tech Literacy Tips!</h1>
                        <ul>
                            <li>Learn Programming Basics: Step-by-step guides to understand coding concepts and languages.</li>
                            <li>Practical Tech Tips: Simple techniques to improve your digital skills and problem-solving.</li>
                            <li>Build Real Projects: Apply what you learn by creating fun and useful programming projects.</li>
                        </ul>
                    `;
                    rightDiv.style.display = "block";
                    requestAnimationFrame(() => contentDiv.classList.remove("fade-out"));
                });
            });
        });
    });

    // --- Textures & objects ---
    const loader = new THREE.TextureLoader();

    const bgMesh = new THREE.Mesh(
        new THREE.SphereGeometry(100, 64, 64),
        new THREE.MeshBasicMaterial({ map: loader.load('textures/milky_way.jpg'), side: THREE.BackSide })
    );
    scene.add(bgMesh);

    const earthMaterial = new MeshStandardNodeMaterial({
        map: loader.load('textures/earth_day.jpg'),
        emissiveMap: loader.load('textures/earth_night.jpg'),
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.6,
        roughness: 1,
        metalness: 0.6
    });

    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMaterial);
    scene.add(earth);

    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.01,128,128),
        new THREE.MeshStandardMaterial({
            map: loader.load('textures/earth_clouds.jpg'),
            transparent:true, opacity:0.5, depthWrite:false
        })
    );
    scene.add(clouds);

    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.05,128,128),
        new THREE.MeshStandardMaterial({color:0x00D5ff, transparent:true, opacity:0.1, side:THREE.FrontSide})
    );
    scene.add(atmosphere);

    // --- Stars ---
    const starCount = 5000;
    const starPositions = [];
    const starSizes = [];
    for(let i=0;i<starCount;i++){
        starPositions.push((Math.random()-0.5)*200);
        starPositions.push((Math.random()-0.5)*200);
        starPositions.push((Math.random()-0.5)*200);
        starSizes.push(Math.random()*2+0.5);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions,3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes,1));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        sizeAttenuation: true,
        transparent:true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Lights ---
    const sun = new THREE.DirectionalLight(0xffffff, 5);
    sun.position.set(30,10,30);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x555555,0.1));

    // --- Animate ---
    let lastLogTime = 0;
    function animate(time){
        requestAnimationFrame(animate);

        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0006;

        if(controlsEnabled && controls) controls.update();

        const sizes = starGeometry.attributes.size.array;
        for(let i=0;i<sizes.length;i++){
            sizes[i] = 0.5 + Math.random()*2;
        }
        starGeometry.attributes.size.needsUpdate = true;

        renderer.render(scene,camera);

        if(time-lastLogTime>2000){
            console.clear();    
            console.log("Camera position:", camera.position);
            console.log("Scene objects:", scene.children.length);
            lastLogTime=time;
        }
    }
    animate();

    // --- Resize ---
    window.addEventListener('resize',()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
    });
}

init();
