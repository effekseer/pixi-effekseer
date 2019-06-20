(function(){
'use strict'

class EffekseerRenderer extends PIXI.Sprite
{
  constructor()
  {
    super();
    this._gl = null;
  }

  _init()
  {
    effekseer.init(this._gl);
    console.log(effekseer.isVertexArrayObjectSupported());
  }

  _updateEffekseer()
  {
    effekseer.update();
  }

  _renderEffekseer()
  {
    effekseer.draw();
  }

  _render(renderer)
  {
    if(this._gl == null)
    {
      // reset vao (to prevent to change state with effekseer)
      // renderer.geometry.reset();

      var binding1 = renderer.gl.getParameter(renderer.gl.ARRAY_BUFFER_BINDING);
      var binding2 = renderer.gl.getParameter(renderer.gl.ELEMENT_ARRAY_BUFFER_BINDING);

      this._gl = renderer.gl;
      this._windowWidth = renderer.view.width;
      this._windowHeight = renderer.view.height;
      this._init();

      renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, binding1);
      renderer.gl.bindBuffer(renderer.gl.ELEMENT_ARRAY_BUFFER, binding2);

    }

    renderer.batch.flush();

    // reset vao (to prevent to change state with effekseer)
    renderer.geometry.reset();

    // flip vertially (because of OpenGL specification)
    if(renderer.renderTexture.current != null)
    {
      effekseer.setProjectionOrthographic(this._windowWidth, -this._windowHeight, 1.0, 400.0);
      effekseer.setCameraMatrix(
        [
          1,0,0,0,
          0,1,0,0,
          0,0,1,0,
          -this._windowWidth / 2, this._windowHeight / 2, 200.0, 1
        ])
    }
    else
    {
      effekseer.setProjectionOrthographic(this._windowWidth, this._windowHeight, 1.0, 400.0);
      effekseer.setCameraMatrix(
        [
          1,0,0,0,
          0,1,0,0,
          0,0,1,0,
          -this._windowWidth / 2, this._windowHeight / 2, 200.0, 1
        ])
    }

    // Container of pixi does not have update function.
    this._updateEffekseer();
    this._renderEffekseer();

    // Debug code
    // this._gl.clearColor(255, 0, 0, 255);
    // this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

    // effekseer renderer makes state dirty
    renderer.texture.reset();
    renderer.geometry.reset();
    renderer.state.reset();
    renderer.shader.reset();     
  }

  _calculateBounds()
  {
    this._bounds.minX = 0;
    this._bounds.minY = 0;
    this._bounds.maxX = this._windowWidth;
    this._bounds.maxY = this._windowHeight;
  }

  setCameraMatrix(){
    const e = effekseer;
  }
}


class EffekseerEmitter extends PIXI.Sprite
{
  constructor(path)
  {
    super();
      this._gl = null;
      this._path = path;
      this._renderer = null;
      this._effect = null;
      this.handle = null;
      this.isLoaded = false;

      /**
        * Whether it does play the effect on addChild()
        * @type {boolean}
      */
      this.playOnAdd = true;
      this._commands = [];
  }

  _init()
  {
    this._effect = effekseer.loadEffect(this._path, function(){ this.isLoaded=true; }.bind(this));
  }

  _update()
  {
    if(this.handle == null && this.isLoaded && this.playOnAdd)
    {
      this.handle = effekseer.play(this._effect);
      this._commands.forEach(function (v) { v(); });
    }
  }

  _render(renderer)
  {
    if(this._gl == null)
    {
      this._gl = renderer.gl;
      this._init();
    }

    // reset because textue is made null when loading
    // renderer.batch.flush();
    // renderer.texture.reset();
    // renderer.geometry.reset();
    
    // Container of pixi does not have update function.
    this._update();
  }

  /**
  * Set the rotation of this effect instance.
  * @param {number} x X value of euler angle
  * @param {number} y Y value of euler angle
  * @param {number} z Z value of euler angle
   */
  setRotation(x, y, z)
  {
    this.handle.setRotation(x,y,z);
  }

  /**
	* Set the position of this effect instance.
	* @param {number} x X value of location
	* @param {number} y Y value of location
	*/
  setPosition(x, y)
  {
    if (this.isLoaded)
    {
      this.handle.setLocation(x,-y,0.0);
    }
    else
    {
      var f = function () { this.handle.setLocation(x, -y, 0.0); }.bind(this);
      this._commands.push(f);
    }
  }

  /**
   * Set the scale of this effect instance.
   * @param {number} x X value of scale factor
   * @param {number} y Y value of scale factor
   * @param {number} z Z value of scale factor
   */
  setScale(x, y, z)
  {
    if (this.isLoaded)
    {
      this.handle.setScale(x, y, z);
    }
    else
    {
      var f = function () { this.handle.setScale(x, y, z); }.bind(this);
      this._commands.push(f);
    }
  }

  /**
	* Set the target location of this effect instance.
	* @param {number} x X value of target location
	* @param {number} y Y value of target location
	* @param {number} z Z value of target location
	*/
  setTargetPosition(x, y, z)
  {
    this.handle.setTargetLocation(x,y,z);
  }

  /**
   * if returned false, this effect is end of playing.
   * @property {boolean}
   */
  exists()
  {
    return !!Core.Exists(this.handle);
  }

  /**
   * Play effect.
   */
  play()
  {
    if(this.handle == null && this.isLoaded)
    {
      this.handle = effekseer.play(this._effect);
      this._commands.forEach(function (v) { v(); });
    }
  }

  /**
   * Stop this effect instance.
   */
  stop()
  {
    this.handle.stop();
  }

  isInitialized()
  {
    return this.isLoaded && this.handle !==null;
  }

  isPlaying()
  {
    return  !this.isInitialized() ||  this.exists();
  }
}



if (PIXI)
{
  PIXI.EffekseerRenderer = EffekseerRenderer;
  PIXI.EffekseerEmitter = EffekseerEmitter;
}
else
{
  console.error('Error: Cannot find global variable `PIXI`, Effekseer plguin will not be installed.');
}

})();