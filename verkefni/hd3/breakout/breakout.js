var canvas;
var gl;

// Núverandi staðsetning miðju ferningsins
var cube = vec2( 0.0, 0.0 );

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

// Hálf breidd/hæð ferningsins
var cubeRad = 0.02;

// Staðsetning og hraði spaðans
var paddlePos = vec2(0.0, -0.8);
var paddleStepSize = 0.1;

// Litir
var paddleColor = vec4(0.0, 0.0, 1.0, 1.0);
var cubeColor = vec4(1.0, 0.0, 0.0, 1.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    // Gefa ferningnum slembistefnu í upphafi
    dX = Math.random()*0.1-0.05;
    dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vertices = [
        // Paddle
        vec2( -0.2, -0.02 ),
        vec2( -0.2, 0.02 ),
        vec2(  0.2, 0.02 ),
        vec2(  0.2, -0.02 ),

        // Cube
        vec2(-cubeRad, -cubeRad),
        vec2(cubeRad, -cubeRad),
        vec2(cubeRad, cubeRad),
        vec2(-cubeRad, cubeRad),
    ];
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locCube = gl.getUniformLocation( program, "cubePos" );
    colorLoc = gl.getUniformLocation( program, "fColor" );

    // Event listener for keyboard
    window.addEventListener("keydown", function(e){
        switch( e.key ) {
            case "ArrowLeft":
                if (paddlePos[0] + paddleStepSize* -2 > -maxX)
                    paddlePos[0] -= paddleStepSize;
                break;
            case "ArrowRight":
                if (paddlePos[0] + paddleStepSize* 2 < maxX)
                    paddlePos[0] += paddleStepSize;
                break;
        }
    } );

    render();
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    renderBouncingCube();
    renderPaddle();

    detectCollision();

    window.requestAnimFrame(render);
}

function renderBouncingCube() {
    // Láta ferninginn skoppa af veggjunum
    if (Math.abs(cube[0] + dX) > maxX - cubeRad) dX = -dX;
    if (Math.abs(cube[1] + dY) > maxY - cubeRad) dY = -dY;

    // Uppfæra staðsetningu
    cube[0] += dX;
    cube[1] += dY;

    gl.uniform4fv(colorLoc, cubeColor);

    gl.uniform2fv( locCube, flatten(cube));

    gl.drawArrays( gl.TRIANGLE_FAN, 4, 4 );
}

function renderPaddle() {

    gl.uniform4fv(colorLoc, paddleColor);

    gl.uniform2fv(locCube, flatten(paddlePos))
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
}

function detectCollision() {
    var paddleBounds = [
        paddlePos[0] - 0.2,
        paddlePos[0] + 0.2,
        paddlePos[1] - 0.02,
        paddlePos[1] + 0.02,
    ]

    if ((cube[1] + dY > paddleBounds[2]) && (cube[1] + dY < paddleBounds[3])) {
        if ((cube[0] + dX > paddleBounds[0]) && (cube[0] + dX < paddleBounds[1])) {
            dY = -dY;
        }
    }
}