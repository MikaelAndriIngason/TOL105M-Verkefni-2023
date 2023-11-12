import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, SphereGeometry,MeshBasicMaterial, Mesh } from 'three';
import * as helpers from './helpers.js';

// Create the scene
const scene = new Scene();

// Create camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 12;
camera.rotation.x = helpers.degreesToRadians(-90);

// Create the renderer
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the garden elf
const elfGeometry = new BoxGeometry();
const elfMaterial = new MeshBasicMaterial({color: 0x00ffffff});
const elf = new Mesh(elfGeometry, elfMaterial);
elf.position.z = 4;
scene.add(elf);

var keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

var points = 0;

var centipedeStartingRow = -8;
var centipedeSegments = 6;
var centipedeSpeed = 0.1;

// Create centipede body (array of centipede segments)
const centipedeBody = [];
const centipedeSegmentGeometry = new SphereGeometry(0.5, 16, 8);
const centipedeSegmentMaterial1 = new MeshBasicMaterial({color: 0x00CC00});
const centipedeSegmentMaterial2 = new MeshBasicMaterial({color: 0x008200});
for (let i = 0; i < centipedeSegments; i++) {
    let centipedeSegmentMaterial = i % 2 == 0 ? centipedeSegmentMaterial1 : centipedeSegmentMaterial2;
    if (i == 0) {
        centipedeSegmentMaterial = new MeshBasicMaterial({color: 0xCC0000});
    }
    const centipedeSegment = new Mesh(centipedeSegmentGeometry, centipedeSegmentMaterial);
    centipedeSegment.position.z = centipedeStartingRow -1 - i;
    centipedeBody.push(centipedeSegment);
    scene.add(centipedeSegment);
}

// Create a centipede object
const centipede = {
    segments: [],
    //row: centipedeStartingRow,
    starting: true
};

// Add segments to centipede
for (let i = 0; i < centipedeSegments; i++) {
    var segment = {
        position: {
            x: 0,
            z: centipedeStartingRow - 1 - i
        },
        direction: 1,
        row: centipedeStartingRow
    };
         
    centipede.segments.push(segment);
}


// create plane
var planeGeometry = new THREE.PlaneGeometry(15, 16);
var planeMaterial = new THREE.MeshBasicMaterial({color: 0x141414, side: THREE.DoubleSide});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = helpers.degreesToRadians(90);
plane.position.z = -0.5;
plane.position.y = -0.5;
scene.add(plane);

var areaBoundaries = {
    minX: -7,
    maxX: 7,
    minZ: -8,
    maxZ: 8
};

const bullets = [];
const mushrooms = [];

// Function to handle shooting
function shoot() {
    const bulletGeometry = new BoxGeometry(0.1, 0.1, 1);
    const bulletMaterial = new MeshBasicMaterial({ color: 0xa30000 });
    const bullet = new Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(elf.position); // Set the initial position of the bullet to the player's position
    scene.add(bullet);
    bullets.push(bullet);
}

// Create mushrooms
for (let i = 0; i < 14; i++) {
    const mushroomGeometry = new SphereGeometry(0.5, 16, 8);
    const mushroomMaterial = new MeshBasicMaterial({ color: 0x5CDE5C });
    const mushMesh = new Mesh(mushroomGeometry, mushroomMaterial);

    let posX = Math.floor(Math.random() * 15) - 7;

    mushMesh.position.z = i - 7;
    mushMesh.position.x = posX;
    scene.add(mushMesh);

    var mushroom = {
        health: 4,
        position: {
            x: posX,
            y: 0,
            z: i - 7
        },
        mesh: mushMesh
    };
    mushrooms.push(mushroom);
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Player movement
    if (keys.up && elf.position.z >= areaBoundaries.minZ) elf.position.z -= 0.2;
    if (keys.down && elf.position.z <= areaBoundaries.maxZ) elf.position.z += 0.2;
    if (keys.left && elf.position.x >= areaBoundaries.minX) elf.position.x -= 0.2;
    if (keys.right && elf.position.x <= areaBoundaries.maxX) elf.position.x += 0.2;

    // Centipede movement
    centipede.segments.forEach(function (s, i) {
        if (s.position.z < s.row && s.position.z <= areaBoundaries.maxZ && (s.position.x + (centipedeSpeed * s.direction) <= areaBoundaries.minX || s.position.x + (centipedeSpeed * s.direction) >= areaBoundaries.maxX)) {
            s.position.z += centipedeSpeed;
        } else if (s.position.x + (centipedeSpeed * s.direction) < areaBoundaries.minX || s.position.x + (centipedeSpeed * s.direction) > areaBoundaries.maxX) {
            s.direction *= -1;
            s.row += 1;
        } else  {
            s.position.x += centipedeSpeed * s.direction;
        }
        
        centipedeBody[i].position.x = s.position.x;
        centipedeBody[i].position.z = s.position.z;
    });

    // Shooting
    bullets.forEach((bullet, index) => {
        bullet.position.z -= 0.5; // Adjust the speed of the bullet
        // Check for collisions with centipede segments
        centipede.segments.forEach((segment, i) => {
            const distance = bullet.position.distanceTo(centipedeBody[i].position);
            if (distance < 1) {
                // Collision detected, remove the bullet and the centipede segment
                scene.remove(bullet);
                bullets.splice(index, 1);
                scene.remove(centipedeBody[i]);
                centipedeBody.splice(i, 1);
                centipede.segments.splice(i, 1);

                if(i === 0) {
                    points += 100;
                } else {
                    points += 10;
                }
            }
        });
        // Check for collisions with mushrooms
        mushrooms.forEach((mushroom, i) => {
            //console.log(mushroom);
            const distance = bullet.position.distanceTo(mushroom.position);
            if (distance < 1) {
                // Collision detected, remove the bullet and reduce the mushroom's health
                scene.remove(bullet);
                bullets.splice(index, 1);
                mushroom.health--;
                if (mushroom.health == 0) {
                    scene.remove(mushroom.mesh);
                    mushrooms.splice(i, 1);
                    points += 1;
                }
            }
        });
    });
    console.log(points)

    // change points DOM element
    document.getElementById("points").innerHTML = points;
}
animate();


window.addEventListener('keydown', function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
        case 'Space':
            shoot();
            break;
    }
});

window.addEventListener('keyup', function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
    }
});
