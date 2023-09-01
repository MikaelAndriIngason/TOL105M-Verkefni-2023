var gl;
var points;

window.onload = function init() 
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var vertices = [];

    for (var i = 0; i < 100; i++) {
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;

        vertices.push(x, y, x + 0.1, y - 0.2, x - 0.1, y - 0.2)
    }
    vertices = new Float32Array(vertices);

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Find the location of the variable fColor in the shader program
    colorLoc = gl.getUniformLocation( program, "fColor" );

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < 100; i++) {
        // Random litur
        gl.uniform4f( colorLoc, Math.random(), Math.random(), Math.random(), 1.0 );

        gl.drawArrays(gl.TRIANGLES, i * 3, 3);
    }
}
