var gl;
var points;

// Tengingar við shader
var colorLoc;
var positionLoc;

// Staða
var crossedTimes = 0;
var crossed = [false, false];

// Stillingar
const stepSize = 0.2;
const amountOfRoads = 5;

// Bílar
var cars = [];
var carColors = [];
const carSpeed = 0.004;

// Froskur
var frogPosition = vec2(0.0, -0.4);
const bounds = [-1.0, 1.4, 1.0, -0.4]

// Litir
const frogColor = vec4(0.0, 1.0, 0.0, 1.0);
const roadColor = vec4(0.0, 0.0, 0.0, 0.7);
const carColor = vec4(0.8, 0.25, 0.3, 1.0);

window.onload = function init() 
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    // Býr til leikinn
    createGame();

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Find the location of the variable fColor in the shader program
    colorLoc = gl.getUniformLocation( program, "fColor" );
    positionLoc = gl.getUniformLocation(program, "position");
    rotationLoc = gl.getUniformLocation(program, "rotation");

    // Nær í input frá spilara og færir froskinn
    moveFrog();

    render();
}

/**
 * Býr til leikinn
 */
function createGame() {
    // Býr til hluti í leiknum
    objects = [
        // Player
        vec2(0.0, -0.4),
        vec2(0.1, -0.6),
        vec2(-0.1, -0.6),

        // Road
        vec2(-1, -0.4),
        vec2(1, -0.4),
        vec2(1, 0.6),
        vec2(-1, -0.4),
        vec2(-1, 0.6),
        vec2(1, 0.6),

        // Car
        vec2(1.0, -0.6),
        vec2(0.6, -0.6),
        vec2(0.6, -0.4),
        vec2(0.6, -0.4),
        vec2(1.0, -0.6),
        vec2(1.0, -0.4),
    ];

    // Býr til alla bílana
    generateCars();

    gl.bufferData(gl.ARRAY_BUFFER, flatten(objects), gl.STATIC_DRAW);
}

/**
 * Renderar leikinn
 */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    renderRoad();       // Renderar veginn

    renderCars();       // Renderar bílana

    detectCollision();  // Skoðar hvort að froskurinn hafi rekist á bíl

    renderFrog();       // Renderar froskinn

    statusOfGame();     // Skoðar stöðu leiksins

    window.requestAnimationFrame(render);
}

/**
 * Nær í input frá spilara og færir froskinn
 */
function moveFrog() {
    window.addEventListener("keydown", function(e) {
        switch (e.key) {
            // Færir froskinn upp
            case "ArrowUp":
                if (frogPosition[1] + stepSize <= bounds[1]) {
                    frogPosition[1] += stepSize;
                }
                break;
            // Færir froskinn niður
            case "ArrowDown":
                if (frogPosition[1] - stepSize >= bounds[3]) {
                    frogPosition[1] -= stepSize;
                }
                break;
            // Færir froskinn til vinstri
            case "ArrowLeft":
                if (frogPosition[0] - stepSize >= bounds[0]) {
                    frogPosition[0] -= stepSize;
                }
                break;
            // Færir froskinn til hægri
            case "ArrowRight":
                if (frogPosition[0] + stepSize <= bounds[2]) {
                    frogPosition[0] += stepSize;
                }
                break;
        }
    });
}

/**
 * Renderar froskinn
 */
function renderFrog() {
    gl.uniform4fv( colorLoc, frogColor );
    gl.uniform2fv(positionLoc, frogPosition);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/**
 * Renderar veginn
 */
function renderRoad() {
    gl.uniform4fv( colorLoc, roadColor );
    gl.uniform2fv(positionLoc, vec2(0.0, -0.2));

    gl.drawArrays(gl.TRIANGLES, 3, 6);
}

/**
 * Renderar bílana
 */
function renderCars() {
    // Fer í gegnum alla bílana og renderar þá
    for (var i = 0; i < cars.length; i++) {
        for (var j = 0; j < cars[i].length; j++) {
            var car = cars[i][j];
            car[0] -= carSpeed * (i + 1) * 0.95;

            // Ef bíllinn fer út af skjánum þá er hann færður aftur á byrjunarstað
            if (car[0] < bounds[0] -2) {
                car[0] = bounds[2];
            }

            gl.uniform2fv(positionLoc, vec2(car[0] - 0.6, car[1]));

            gl.uniform4fv(colorLoc, carColors[i * 2 + j]);

            gl.drawArrays(gl.TRIANGLES, 9, 6);
        }
    }
}

/**
 * Býr til bílana
 */
function generateCars() {
    // Fyrir hvern veg þá er búið til 2 bíla
    for (var i = 0; i < amountOfRoads; i++) {
        var carLane = [];

        // Byrjunar staðsetning bílsins og bil á milli bíla
        var startOffset = Math.random();
        var carGap = Math.random() * 1.5 + 1;

        for (var j = 0; j < 2; j++) {
            var car = vec2(1.0 + (j * carGap) - startOffset, -0 + (i * 0.2));
            carLane.push(car);
        }

        cars.push(carLane);
    }

    // Býr til random lit fyrir hvern bíl
    for (var i = 0; i < cars.length; i++) {
        for (var j = 0; j < cars[i].length; j++) {
            carColors.push(randomColor());
        }
    }
}

/**
 * Býr til random lit
 * @returns {vec4} random litur
 */
function randomColor() {
    return vec4(Math.random(), Math.random(), Math.random(), 1.0);
}

/**
 * Skoðar stöðu leiksins, hvort að froskurinn hafi komist yfir götuna eða ekki
 */
function statusOfGame() {
    
    if (!crossed[0] && frogPosition[1] > 0.8) { 
        crossed[0] = true;
        crossed[1] = false;
        crossedTimes++;
    }
    if (crossed[0] && frogPosition[1] <= 0) {
        crossed[0] = false;
        crossed[1] = true;
        crossedTimes++;
    }

    // Birtir stöðu leiksins
    var h2 = document.getElementById("points");
    h2.innerHTML = "Crossed " + crossedTimes + " times";
}

/**
 * Skoðar hvort að froskurinn hafi rekist á bíl
 */
function detectCollision() {

    // Collision kassi frosksins
    var frogBounds = [
        frogPosition[0] - 0.08,
        frogPosition[0] + 0.08,
        frogPosition[1] - 0.02,
        frogPosition[1] - 0.18
    ];

    // Fer é gegnum alla bíla og skoðar hvort að collision hafi átt sér stað
    for (var i = 0; i < cars.length; i++) {
        for (var j = 0; j < cars[i].length; j++) {
            var car = cars[i][j];

            // Collision kassi bílsins
            var carBounds = [
                car[0],
                car[0] + 0.4,
                car[1],
                car[1] - 0.2
            ];

            // Skoðar hvort að collision hafi átt sér stað, og ef svo er þá er froskurinn resettur
            if (frogBounds[1] > carBounds[0] && frogBounds[0] < carBounds[1] && frogBounds[2] > carBounds[3] && frogBounds[3] < carBounds[2]) {
                death();
            }
        }
    }
}

/**
 * Resettar froskinn
 */
function death() {
    crossed = [false, false];
    frogPosition = vec2(0.0, -0.4);
}

