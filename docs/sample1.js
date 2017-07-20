﻿
var renderer = new PIXI.WebGLRenderer(256, 256);

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

var effekseerRenderer = new PIXI.EffekseerRenderer();
stage.addChild(effekseerRenderer);

var effekseerEmitter = null;

function animate()
{
  if(effekseerEmitter == null || !effekseerEmitter.exists())
  {
    effekseerEmitter = new PIXI.EffekseerEmitter('Resource/Laser01.efk');
    stage.addChild(effekseerEmitter);
    effekseerEmitter.setPosition(128.0, 128.0);
    effekseerEmitter.setScale(20.0, 20.0, 20.0);
  }
 
  requestAnimationFrame(animate);
  renderer.render(stage);
}

requestAnimationFrame(animate);