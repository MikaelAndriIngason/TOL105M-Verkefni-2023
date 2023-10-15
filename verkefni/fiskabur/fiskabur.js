var canvas;
var gl;

var tankSize = 4.0;
var amountOfFishes = 100;
var fishes = [];

// Hjarðarreglur
var separationScale = 0.02;
var alignmentScale = 0.02;
var cohesionScale = 0.02;

// Hnútar fisksins
var fish = [
    // Body
    vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2, -0.15, 0.0, 1.0 ),
	vec4( -0.5,  0.0, 0.0, 1.0 ),
	// Tail
    vec4( -0.5,  0.0, 0.0, 1.0 ),
    vec4( -0.65,  0.15, 0.0, 1.0 ),
    vec4( -0.65, -0.15, 0.0, 1.0 ),
    // Left fin
    vec4(0.0, 0.1, 0.0, 1.0),
    vec4(0.2, 0.2, 0.0, 1.0),
    vec4(0.2, 0.0, 0.0, 1.0),
    // Right fin
    vec4(0.0, 0.1, 0.0, 1.0),
    vec4(-0.2, 0.2, 0.0, 1.0),
    vec4(-0.2, 0.0, 0.0, 1.0)
];

// Hnútar búrsins
var tank = [
    vec3( -tankSize, -tankSize,  tankSize ),
    vec3( -tankSize,  tankSize,  tankSize ),
    vec3(  tankSize,  tankSize,  tankSize ),
    vec3(  tankSize, -tankSize,  tankSize ),
    vec3( -tankSize, -tankSize, -tankSize ),
    vec3( -tankSize,  tankSize, -tankSize ),
    vec3(  tankSize,  tankSize, -tankSize ),
    vec3(  tankSize, -tankSize, -tankSize )
];

// Línur búrsins
var lines = [ tank[0], tank[1], tank[1], tank[2], tank[2], tank[3], tank[3], tank[0],
              tank[4], tank[5], tank[5], tank[6], tank[6], tank[7], tank[7], tank[4],
              tank[0], tank[4], tank[1], tank[5], tank[2], tank[6], tank[3], tank[7]
];

var movement = false;     // Er músarhnappur niðri?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zView = 10.0;         // Staðsetning áhorfanda á z-hniti

var proLoc;
var mvLoc;
var colorLoc;

var fishBuffer;
var fishVPosition;

var tankBuffer;
var tankVPosition;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
 
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    //=================================================================
    fishBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fishBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fish.slice(0, 15)), gl.STATIC_DRAW);

    fishVPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(fishVPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(fishVPosition);

    tankBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tankBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW);

    tankVPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(tankVPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tankVPosition);
    //=================================================================

    colorLoc = gl.getUniformLocation( program, "fColor" );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    // Setjum ofanvarpsfylki hér í upphafi
    var proj = perspective( 100.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    // Hreifing notanda
    controls(); 

    // Býr til fiska
    createFishes();

    // Teiknar senuna
    render();
}

/**
 * Hreyfing notanda (view point)
 */
function controls() {

    // Atburðaföll fyrir mús
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault(); // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY += (e.offsetX - origX) % 360;
            spinX += (e.offsetY - origY) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    // Atburðaföll fyrir lyklaborð
    window.addEventListener("keydown", function(e){
        switch( e.key ) {
           case "ArrowUp":	 // Upp ör
               zView -= 0.2;
               break;
           case "ArrowDown": // Niður ör
               zView += 0.2;
               break;
        }
    }  );  

    // Atburðaföll fyrir músarhjól
    window.addEventListener("mousewheel", function(e){
        if( e.wheelDelta < 0.0 ) {
            zView += 0.2;
        } else {
            zView -= 0.2;
        }
    }); 
}

/**
 * Býr til alla fiskana
 */
function createFishes() {
    // Tæmir fiski fylkið
    fishes = [];

    for (var i = 0; i < amountOfFishes; i++) {
        // Random staðsetning á búrinu
        var position = vec3(
            Math.random() * (tankSize * 2) - tankSize,
            Math.random() * (tankSize * 2) - tankSize,
            Math.random() * (tankSize * 2) - tankSize
        );

        // Random stefna
        var direction = vec3(
            Math.random() * 0.05 - 0.02,
            Math.random() * 0.02 - 0.01,
            Math.random() * 0.05 - 0.02
        );

        // Random litur
        var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);

        // Bætir fiskinum í fylkið
        fishes.push({
            position: position,
            direction: direction,
            rotTail: Math.random() * 70 - 35,
            rotFins: Math.random() * 80 + 90,
            incTail: Math.random() * 3.0 + 1.0,
            incFins: Math.random() * 3.0 + 1.0,
            color: color
        });
    }
}

/**
 * Teiknar senuna
 */
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt( vec3(0.0, 0.0, zView), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );

    moveFishes();

    fishes.forEach((fish) => {
        renderFish(mv, fish);
    });

    renderTank(mv);

    requestAnimFrame(render);
}

/**
 * Teiknar fiskinn
 */
function renderFish(mv, fish) {
    // Buffer fisksins
    gl.bindBuffer(gl.ARRAY_BUFFER, fishBuffer);
    gl.vertexAttribPointer(fishVPosition, 4, gl.FLOAT, false, 0, 0);

    // Færir fiskinn
    mv = mult(mv, translate(fish.position));

    // Snúningur fisksins miðað við stefnu hans
    var fishRotationY = (Math.atan2(fish.direction[0], fish.direction[2]) + radians(-90)) * (180 / Math.PI);
    var fishRotationZ = (Math.atan2(fish.direction[1], Math.sqrt(fish.direction[0] * fish.direction[0] + fish.direction[2] * fish.direction[2]))) * (180 / Math.PI);
    mv = mult(mv, rotateY(fishRotationY));
    mv = mult(mv, rotateZ(fishRotationZ));

    // Snúningur á sporðinum
    fish.rotTail += fish.incTail;
    if( fish.rotTail > 35.0  || fish.rotTail < -35.0 )
        fish.incTail *= -1;

    // Snúningur á hliðaruggunum
    fish.rotFins += fish.incFins;
    if( fish.rotFins > 170.0  || fish.rotFins < 90.0 )
        fish.incFins *= -1;

    // Litur líkamans
    gl.uniform4fv( colorLoc, fish.color );

	// Teiknar líkaman fisksins
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // Litur sporðsins og hliðarugganna
    gl.uniform4fv( colorLoc, vec4(fish.color[0] - 0.2, fish.color[1] - 0.2, fish.color[2] - 0.2, 1.0) );

    // Teiknar sporðinn og snúa honum
	var tailMv = mv;
    tailMv = mult(tailMv, translate(-0.5, 0.0, 0.0));
    tailMv = mult(tailMv, rotateY(fish.rotTail));
    tailMv = mult(tailMv, translate(0.5, 0.0, 0.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(tailMv));
    gl.drawArrays(gl.TRIANGLES, 6, 3);

    // Teiknar vinstri hliðarugga og snúa honum
    var finsMv = mv;
    finsMv = mult(finsMv, translate(0.2, -0.1, 0.0));
    finsMv = mult(finsMv, rotateY(fish.rotFins));
    gl.uniformMatrix4fv(mvLoc, false, flatten(finsMv));
    gl.drawArrays(gl.TRIANGLES, 9, 3);

    // Teiknar hægri hliðarugga og snúa honum
    finsMv = mv;
    finsMv = mult(finsMv, translate(0.2, 0.1, 0.0));
    finsMv = mult(finsMv, rotateZ(180));
    finsMv = mult(finsMv, rotateY(fish.rotFins));
    gl.uniformMatrix4fv(mvLoc, false, flatten(finsMv));
    gl.drawArrays(gl.TRIANGLES, 12, 3);
}

/**
 * Teiknar fiskibúrið (kassi)
 */
function renderTank(mv) {
    // Buffer búrsins
    gl.bindBuffer(gl.ARRAY_BUFFER, tankBuffer);
    gl.vertexAttribPointer(tankVPosition, 3, gl.FLOAT, false, 0, 0);

    // Litur búrsins
    gl.uniform4fv(colorLoc, vec4(0.0, 0.0, 1.0, 1.0));

    // Teiknar búrið
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.LINES, 0, 24);
}

/**
 * Hreifir fiskana
 */
function moveFishes() {

    // Fer í gegnum alla fiska
    fishes.forEach((fish) => {
        // Hjarðarhegðun
        flocking(fish);

        // Hreifir fiskinn
        fish.position = add(fish.position, fish.direction);

        // Ef fiskurinn fer út úr búrinu á X-ásinum þá kemur hann aftur hinum megin á búrinu
        if (fish.position[0] > tankSize) {
            fish.position[0] = -tankSize;
        } else if (fish.position[0] < -tankSize) {
            fish.position[0] = tankSize;
        }

        // Y-ásin
        if (fish.position[1] > tankSize) {
            fish.position[1] = -tankSize;
        } else if (fish.position[1] < -tankSize) {
            fish.position[1] = tankSize;
        }

        // Z-ásin
        if (fish.position[2] > tankSize) {
            fish.position[2] = -tankSize;
        } else if (fish.position[2] < -tankSize) {
            fish.position[2] = tankSize;
        }
    });
}

/**
 * Hjarðarhegðun fiskanna
 * @param {*} fish Fiskurinn sem á að hreyfa
 */
function flocking(fish) {
    // Hjarðarreglur
    var separation = vec3(0.0, 0.0, 0.0);
    var alignment = vec3(0.0, 0.0, 0.0);
    var cohesion = vec3(0.0, 0.0, 0.0);

    // Fjöldi fiska í nágrenninu
    var neighbors = 0;

    // Finnur alla fiska í nágrenninu
    fishes.forEach((otherFish) => {
        // Ef það er fiskur innan við fjarlægðina 1.0
        if (fish != otherFish && distance(fish.position, otherFish.position) < 1.0) {
            neighbors++;
            
            // Heldur fjarlægð frá öðrum fiskum
            var difference = subtract(fish.position, otherFish.position);
            difference = normalize(difference);
            separation = add(separation, difference);

            // Stefna hjarðarinnar
            alignment = add(alignment, otherFish.direction);

            // Meðalstaðsetning hjarðarinnar
            cohesion = add(cohesion, otherFish.position);
        }
    });

    // Reiknar nýja stefnu fiskins
    if (neighbors > 0) { 
        // Setur alignment sem meðalstefnu hjarðarinnar
        alignment = scale(1 / neighbors, alignment);

        // Setur cohesion sem meðalstaðsetningu hjarðarinnar  
        cohesion = scale(1 / neighbors, cohesion);
        cohesion = subtract(cohesion, fish.position);

        separation = normalize(separation);
        alignment = normalize(alignment);
        cohesion = normalize(cohesion);

        separation = scale(separationScale, separation);
        alignment = scale(alignmentScale, alignment);
        cohesion = scale(cohesionScale, cohesion);

        var newDirection = add(alignment, cohesion);
        newDirection = add(newDirection, separation);

        // Breytir stefnu fiskins
        fish.direction = newDirection;
    }
}

/**
 * Hjálparfall sem reiknar fjarlægð á milli tveggja hnúta
 * @param {*} a Hnútur a
 * @param {*} b Hnútur b
 * @returns Fjarlægð á milli a og b
 */
function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) +
                     Math.pow(a[1] - b[1], 2) +
                     Math.pow(a[2] - b[2], 2));
}

/**
 * Uppfærir fjölda fiska í búrinu
 * @param {*} value Nýr fjöldi fiska
 */
function changeAmountOfFishes(value) {
    amountOfFishes = value;
    createFishes();
}

var separationInput = document.getElementById("separation");
var alignmentInput = document.getElementById("alignment");
var cohesionInput = document.getElementById("cohesion");

// Atburðaföll fyrir hjarðarreglur
separationInput.addEventListener("input", function () {
    separationScale = parseFloat(separationInput.value);
});

alignmentInput.addEventListener("input", function () {
    alignmentScale = parseFloat(alignmentInput.value);
});

cohesionInput.addEventListener("input", function () {
    cohesionScale = parseFloat(cohesionInput.value);
});
