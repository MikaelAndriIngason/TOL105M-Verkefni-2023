import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, SphereGeometry, MeshBasicMaterial, Mesh, DoubleSide, PlaneGeometry, ZeroStencilOp } from 'three';
import * as helpers from './helpers.js';


/*==============================================================================
Variables
/==============================================================================*/

var points = 0;

// Entities
const allCentipedes = [];
const mushrooms = [];
const bullets = [];

// Centipede settings
var centipedeStartingRow = -8;
var centipedeSegments = 6;
var centipedeSpeed = 0.1;

var bulletSpeed = 0.5;
var playerSpeed = 0.2;

// User input
var keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Play area boundaries
var areaBoundaries = {
    minX: -7,
    maxX: 7,
    minZ: -8,
    maxZ: 8,
    playerMinZ: 2,
};

// Materials
const playerMaterial = new MeshBasicMaterial({color: 0x00ffffff});
const centipedeMaterial1 = new MeshBasicMaterial({color: 0x00CC00});
const centipedeMaterial2 = new MeshBasicMaterial({color: 0x008200});
const centipedeHeadMaterial = new MeshBasicMaterial({color: 0xCC0000});
const planeMaterial = new MeshBasicMaterial({color: 0x141414, side: DoubleSide});
const bulletMaterial = new MeshBasicMaterial({ color: 0xa30000 });
const mushroomMaterial = new MeshBasicMaterial({ color: 0x5CDE5C });


/*==============================================================================
Initialization
/==============================================================================*/

// Create the scene
const scene = new Scene();

// Create the renderer
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the main camera
const mainCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
mainCamera.position.set(0, 7, 10);
mainCamera.rotation.x = helpers.degreesToRadians(-45);

// Create the secondary camera
const secondaryCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create the third camera
const thirdCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
thirdCamera.position.set(0, 12, 0);
thirdCamera.rotation.x = helpers.degreesToRadians(-90);
  
// Set the initial active camera
let activeCamera = mainCamera;


/*==============================================================================
Entities and geometry
/==============================================================================*/

// Create a plane for the ground
var planeGeometry = new PlaneGeometry(15, 16);
var plane = new Mesh(planeGeometry, planeMaterial);
plane.rotation.x = helpers.degreesToRadians(90);
plane.position.set(0, -0.5, -0.5);
scene.add(plane);

// Create the player
const playerGeometry = new BoxGeometry();
const player = new Mesh(playerGeometry, playerMaterial);
player.position.z = 4;
scene.add(player);

// Create the centipede
(function() {

    const centipedeSegmentGeometry = new SphereGeometry(0.5, 16, 8);

    // Create a centipede object
    const centipede = {
        segments: [],
        mesh: []
    };

    // Add segments to centipede
    for (let i = 0; i < centipedeSegments; i++) {
        var segment = {
            position: {
                x: 7,
                y: 0,
                z: centipedeStartingRow - 1 - i
            },
            direction: 1,
            row: centipedeStartingRow
        }; 
        centipede.segments.push(segment);

        // Create the mesh
        let centipedeSegmentMaterial = i % 2 == 0 ? centipedeMaterial1 : centipedeMaterial2;
        if (i == 0)
            centipedeSegmentMaterial = centipedeHeadMaterial;
        const centipedeSegment = new Mesh(centipedeSegmentGeometry, centipedeSegmentMaterial);
        centipedeSegment.position.z = centipedeStartingRow -1 - i;
        centipede.mesh.push(centipedeSegment);
        scene.add(centipedeSegment);
    }
    allCentipedes.push(centipede);
})();

// Create mushrooms
for (let i = 0; i < 14; i++) {
    let posX = Math.floor(Math.random() * 15) - 7;

    if (posX === 0 && i - 7 === 4)
        posX = 1;

    createMushroom(posX, i - 7);
}


/*==============================================================================
Functions
/==============================================================================*/

/**
 * Function to toggle between the main and secondary camera
 */
function toggleCamera() {
    if (activeCamera === mainCamera) {
        activeCamera = secondaryCamera;
    } else if (activeCamera === secondaryCamera) {
        activeCamera = thirdCamera;
    } else {
        activeCamera = mainCamera;
    }
}

/**
 * Function to create a mushroom
 * @param {*} x the x position of the mushroom
 * @param {*} z the z position of the mushroom
 */
function createMushroom(x, z) {
    const mushroomGeometry = new SphereGeometry(0.5, 16, 8);
    const mushMesh = new Mesh(mushroomGeometry, mushroomMaterial);

    mushMesh.position.set(x, 0, z);
    scene.add(mushMesh);

    var mushroom = {
        health: 4,
        position: {
            x: x,
            y: 0,
            z: z
        },
        mesh: mushMesh
    };
    mushrooms.push(mushroom);
}

/**
 * Function to handle shooting
 */
function shoot() {
    const bulletGeometry = new BoxGeometry(0.1, 0.1, 1);
    const bullet = new Mesh(bulletGeometry, bulletMaterial);
    // Spawn the bullet in the player's position
    bullet.position.copy(player.position);
    scene.add(bullet);
    bullets.push(bullet);
}

/**
 * Function to handle the player movement
 */
function playerMovement() {
    // Moving up
    if (keys.up && player.position.z >= areaBoundaries.playerMinZ) {
        const step = player.position.z - playerSpeed;
        if (!checkCollision(player.position.x, step))
            player.position.z = step;
    }
    
    // Moving down
    if (keys.down && player.position.z <= areaBoundaries.maxZ - 1) {
        const step = player.position.z + playerSpeed;
        if (!checkCollision(player.position.x, step))
            player.position.z = step;
    }
    
    // Moving left
    if (keys.left && player.position.x >= areaBoundaries.minX) {
        const step = player.position.x - playerSpeed;
        if (!checkCollision(step, player.position.z))
            player.position.x = step;
    }

    // Moving right
    if (keys.right && player.position.x <= areaBoundaries.maxX) {
        const step = player.position.x + playerSpeed;
        if (!checkCollision(step, player.position.z))
            player.position.x = step;
    }

    secondaryCamera.position.set(player.position.x, 1, player.position.z);
}

/**
 * Function to check if the player is colliding with a mushroom
 * @param {*} x the x position of the player
 * @param {*} z the z position of the player
 * @returns true if the player is colliding with a mushroom, false otherwise
 */
function checkCollision(x, z) {
    for (const mushroom of mushrooms) {
        const distance = Math.sqrt(Math.pow(mushroom.position.x - x, 2) + Math.pow(mushroom.position.z - z, 2));
        if (distance < 1)
            return true;
    }
    return false;
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, activeCamera);

    const bulletsToRemove = [];

    // Player movement
    playerMovement();

    // Centipede movement
    allCentipedes.forEach(function (centipede) {
        centipede.segments.forEach(function (s, i) {
            // Move down
            if (s.position.z < s.row && s.position.z <= areaBoundaries.maxZ - 1 && (s.position.x + (centipedeSpeed * s.direction) <= areaBoundaries.minX || s.position.x + (centipedeSpeed * s.direction) >= areaBoundaries.maxX)) {
                s.position.z += centipedeSpeed;
            // If the segment is at the last columns, move down and turn around
            } else if (s.position.x + (centipedeSpeed * s.direction) < areaBoundaries.minX || s.position.x + (centipedeSpeed * s.direction) > areaBoundaries.maxX) {
                s.direction *= -1;
                s.row += 1;
            // Move left and right
            } else  {
                s.position.x += centipedeSpeed * s.direction;
            }
            // Update the mesh position
            centipede.mesh[i].position.set(s.position.x, 0, s.position.z);

            // Check for collisions with the player
            const distance = player.position.distanceTo(s.position);
            if (distance < 1) {
                alert("Game over!");
                player.position.set(0, 0, 40); // Move the player to prevent a loop
                location.reload();
                return false;
            }
        });
    });

    // Shooting
    bullets.forEach((bullet, index) => {
        // Moves the bullet forward
        bullet.position.z -= bulletSpeed;

        // Check for collisions with centipedes
        allCentipedes.forEach((centipede) => {
            centipede.segments.forEach((segment, i) => {
                if (centipede.mesh[i]) {
                    // Calculate the distance between the bullet and the centipede segment, and split/remove the centipede if the distance is small enough
                    const distance = bullet.position.distanceTo(centipede.mesh[i].position);
                    if (distance < 0.5) {
                        // Removes the bullet and the centipede segment
                        scene.remove(bullet);
                        bulletsToRemove.push(index);
                        scene.remove(centipede.mesh[i]);

                        // if centipede has the length of 1, remove the centipede
                        if (centipede.segments.length == 1) {
                            allCentipedes.splice(allCentipedes.indexOf(centipede), 1);
                        } else {
                            // Change the color of the head of the new centipede
                            if (i + 1 < centipede.segments.length)
                                centipede.mesh[i + 1].material = centipedeHeadMaterial;

                            // Spawn mushroom at the position of the shot segment
                            createMushroom(centipede.mesh[i].position.x, centipede.mesh[i].position.z);

                            // If the player hits the head or tail, remove the head/tail
                            let hitHeadTail = false;
                            if (i == 0) { 
                                centipede.mesh.splice(i, 1);
                                centipede.segments.splice(i, 1); 
                                hitHeadTail = true;
                            } else if (i == centipede.segments.length - 1) {
                                centipede.mesh.splice(i, 1);
                                centipede.segments.splice(i, 1);
                                hitHeadTail = true;
                            }

                            // Split the centipede if it has more than one segment and the segment is not the head or the tail
                            if (centipede.segments.length > 1 && !hitHeadTail) {

                                // Create a new centipede with the segments after the shot segment
                                const newCentipede = {
                                    segments: centipede.segments.slice(i + 1, centipede.segments.length),
                                    mesh: centipede.mesh.slice(i + 1, centipede.mesh.length)
                                };

                                // Remove the segments/mesh from the shot centipede
                                centipede.segments = centipede.segments.slice(0, i);
                                centipede.mesh = centipede.mesh.slice(0, i);

                                allCentipedes.push(newCentipede);
                            }
                        }

                        // Add points
                        if(i === 0) {
                            points += 100;
                        } else {
                            points += 10;
                        }
                    }
                }
            });
        });

        // Check for collisions with mushrooms
        mushrooms.forEach((mushroom, i) => {
            // Calculate the distance between the bullet and the mushroom
            const distance = bullet.position.distanceTo(mushroom.position);
            if (distance < 1) {
                scene.remove(bullet);
                bulletsToRemove.push(index);
                // Reduce the mushroom's health
                mushroom.health--;
                if (mushroom.health == 0) {
                    scene.remove(mushroom.mesh);
                    mushrooms.splice(i, 1);
                    points += 1;
                }
            }
        });
    });

    // Remove the bullets that collided
    bulletsToRemove.forEach((index) => {
        scene.remove(bullets[index]);
        bullets.splice(index, 1);
    });

    // Update the score
    document.getElementById("points").innerHTML = points;
}
animate();


/*==============================================================================
User input
/==============================================================================*/

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
        case 'KeyC':
            toggleCamera();
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
