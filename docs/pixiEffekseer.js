(function () {
  'use strict'

  class Context
  {
    static _instance = null;

    static allocate() {

      if(this._instance == null)
      {
        this._instance = new Context();
      }
      else {
        this._instance._reference += 1;
      }

     return this._instance;
    }

    constructor() {
      this.context = effekseer.createContext();
      this._reference = 1;
    }

    release() {
      this._reference-= 1;

      if(this._reference == 0)
      {
        this.context.release();
        _instance = null;
      }
    }
  }

  class EffekseerRenderer extends PIXI.Sprite {
    constructor() {
      super();
      this._gl = null;

      this._context = Context.allocate();

      this.on('removed', function() {
        this._context.release();
        this._context = null;
      });
    }

    _init() {
      this._context.context.init(this._gl);
    }

    _updateEffekseer() {
      this._context.context.update();
    }

    _renderEffekseer() {
      this._context.context.draw();
    }

    _render(renderer) {
      if (this._gl == null) {
        // reset vao (to prevent to change state with effekseer)
        // renderer.geometry.reset();

        var ext = renderer.gl.getExtension('OES_vertex_array_object');
        var binding1 = renderer.gl.getParameter(renderer.gl.ARRAY_BUFFER_BINDING);
        var binding2 = renderer.gl.getParameter(renderer.gl.ELEMENT_ARRAY_BUFFER_BINDING);
        var binding_vao = null;
        if (ext != null) {
          binding_vao = renderer.gl.getParameter(ext.VERTEX_ARRAY_BINDING_OES);
        }

        this._gl = renderer.gl;
        this._windowWidth = renderer.view.width;
        this._windowHeight = renderer.view.height;
        this._init();

        if (ext != null) {
          var binding_debug = renderer.gl.getParameter(ext.VERTEX_ARRAY_BINDING_OES);
          ext.bindVertexArrayOES(binding_vao);
        }

        renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, binding1);
        renderer.gl.bindBuffer(renderer.gl.ELEMENT_ARRAY_BUFFER, binding2);

      }

      renderer.batch.flush();

      // reset vao (to prevent to change state with effekseer)
      renderer.geometry.reset();

      // flip vertially (because of OpenGL specification)
      if (renderer.renderTexture.current != null) {
        this._context.context.setProjectionOrthographic(this._windowWidth, -this._windowHeight, 1.0, 400.0);
        this._context.context.setCameraMatrix(
          [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -this._windowWidth / 2, this._windowHeight / 2, 200.0, 1
          ])
      }
      else {
        this._context.context.setProjectionOrthographic(this._windowWidth, this._windowHeight, 1.0, 400.0);
        this._context.context.setCameraMatrix(
          [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
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

    _calculateBounds() {
      this._bounds.minX = 0;
      this._bounds.minY = 0;
      this._bounds.maxX = this._windowWidth;
      this._bounds.maxY = this._windowHeight;
    }
  }

  class EffekseerEffect {
    constructor(path, scale = 1.0) {
      this._gl = null;
      this._path = path;
      this._effect = null;
      this.isLoaded = false;
      this.isFailedToLoad = false;

      this._context = Context.allocate();

      this._effect = this._context.context.loadEffect(
        this._path, 
        scale,
        function () { this.isLoaded = true; }.bind(this),
        function () { this.isFailedToLoad = true; }.bind(this));
    }

      /**
      * Release the effect. Don't touch the instance of effect after released.
      */
    destroy() {
      this._context.context.releaseEffect(this._effect);
      this._effect = null;
      this._context.release();
      this._context = null;
    }
  }

  class EffekseerEmitter extends PIXI.Sprite {
    constructor(effect) {
      super();
      this._gl = null;
      this._renderer = null;
      this._effect = effect;
      this.handle = null;
      this.isLoaded = false;

      this._context = Context.allocate();

      this.on('removed', function() {
        this._context.release();
        this._context = null;
      });

      /**
        * Whether it does play the effect on addChild()
        * @type {boolean}
      */
      this.playOnAdd = true;
      this._commands = [];
    }

    _init() {
      // empty
    }

    _update() {
      if (this.handle == null && this._effect.isLoaded && this.playOnAdd) {
        this.handle = this._context.context.play(this._effect._effect);
        this._commands.forEach(function (v) { v(); });
      }
    }

    _render(renderer) {
      if (this._gl == null) {
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
    setRotation(x, y, z) {
      this.handle.setRotation(x, y, z);
    }

    /**
    * Set the position of this effect instance.
    * @param {number} x X value of location
    * @param {number} y Y value of location
    */
    setPosition(x, y) {
      if (this.isLoaded) {
        this.handle.setLocation(x, -y, 0.0);
      }
      else {
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
    setScale(x, y, z) {
      if (this.isLoaded) {
        this.handle.setScale(x, y, z);
      }
      else {
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
    setTargetPosition(x, y, z) {
      this.handle.setTargetLocation(x, y, z);
    }

    /**
     * if returned false, this effect is end of playing.
     */
    exists() {
      if(this.handle == null) {
        return false;
      }

      return this.handle.exists;
    }

    /**
     * Play effect.
     */
    play() {
      if (this.handle == null && this.isLoaded) {
        this.handle = this._context.context.play(this._effect._effect);
        this._commands.forEach(function (v) { v(); });
      }
    }

    /**
     * Stop this effect instance.
     */
    stop() {
      this.handle.stop();
    }

    isInitialized() {
      return this.isLoaded;
    }

    /**
     * deprecation
     */
    isPlaying() {
      return !this.isInitialized() || this.exists();
    }
  }



  if (PIXI) {
    PIXI.EffekseerRenderer = EffekseerRenderer;
    PIXI.EffekseerEmitter = EffekseerEmitter;
    PIXI.EffekseerEffect = EffekseerEffect;
  }
  else {
    console.error('Error: Cannot find global variable `PIXI`, Effekseer plguin will not be installed.');
  }

})();