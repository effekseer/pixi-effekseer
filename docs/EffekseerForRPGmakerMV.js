//=============================================================================
// EffekseerForRPGmakerMV.js
// ----------------------------------------------------------------------------
// Copyright (c) 2017-2017 Sigureya
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 0.9.0 2017/05/18 初版 
// ----------------------------------------------------------------------------
// [Twitter]: https://twitter.com/Sigureya/
//=============================================================================

/*:
 * @plugindesc 『Effekseer』forツクールMV(エフェクトツール)
 * 
 * @author しぐれん（魔のささやき）
 * 
 * 
 * @help
 * 「Effekseer」で作成したエフェクトをそのままツクール上で再生します。
 * 以下の順序でプラグインを入れてください。
 * effekseer_min.js
 * pixiEffekseer.js
 * effekseerMV.js
 * 
 * 一部の環境では動きません。
 * ・RPGアツマール
 * 　.efkファイルをアップできないので不可。
 * ・ブラウザ実行(Safari)
 * 　ES5に対応していない環境では不可。
 * 
 * var 1.0(2017/5/18) 公開
 * 
 * 
 * ここから先は、プラグイン作成者向けの競合向け情報です。
 * 作成したSprite_EffekseerはSprite_Animationのフリをして動きます。
 * 大体同じような場所に格納されます。
 * Sprite_Base.animationSpritesに格納されていることがあるので、
 * 何かあったら、探ってみてください。
 */
/**
 * TODO 
 * フィールドで、正面に向けて発射するヤツ
 * 終了したら、自分で勝手に消える機能。
 * 
 * ツクールのウィンドウでEffekseerを出した場合、
 * +Y=UP/-Y=DOWN
 * 画面内に収まる数値は、±(Graphics.boxHeight/2)の範囲
 * 完全一致させるには、カメラ系の行列の再設定が必要
 * 
 * アニメーション再生中はwaitの処理がうまく行かない。
 * １回目だけうまく行くけど、２回目以降は早い段階で切れてしまう。
 * Sprite_Base.prototype.updateAnimationSpritesにブレークポイントを張り、
 * sprite.isPlayingがfalseだった時を見ているが、
 * 音が鳴る前に終了扱いにされている。
 */



(function(global){
     'use strict'
     const effekseerStr = 'effekseer';

    const xxx={
        commandKey :'key',
        commandName:'エフェクトテスト',
    };

class Sprite_Effekseer extends PIXI.EffekseerEmitter{
    constructor(path){
        super(path);
    }
    // isPlayingと合わせて、Sprite_Animationのふりをするための処理
    remove(){
        if(this.parent){
            this.parent.removeChild(this);
        }
    }

};

class StandbyEffect{
    constructor(efk,onLoadFunc){
        this.effect = efk;
        this.func=onLoadFunc;
        this.funcCalled =false;
    }
    update(){
        this.effect._handleBind();
        if(this.effect.handle!=null){
            this.func(this.effect);
            this.funcCalled=true;
        }
    }
}


class EffekseerManagerClass {
  constructor(){
   this._standby =[];
   this._renderer =new PIXI.EffekseerRenderer();
  }
  addEffect(efk,onLoadFunc){
      this._standby.push(
          new StandbyEffect(efk,onLoadFunc)
      );
  }

  reserveEffect(filePath,onLoadFunc,parent){
    const efk = new Sprite_Effekseer  (filePath);
    const p = parent || SceneManager._scene;
    p.addChild(efk);

    this._standby.push(new StandbyEffect(efk,onLoadFunc));
  }
  toFilePath(name){
    return 'Resource/'+name +'.efk';
  }
  
  update(){
      this._standby = this._standby.filter( function(v){
          v.update();
          return !v.funcCalled;
      } );

      this._renderer._update();      
  }
};

const EffekseerManager = new EffekseerManagerClass();

const Scene_Base_createWindowLayer =Scene_Base.prototype.createWindowLayer;
Scene_Base.prototype.createWindowLayer =function(){
    Scene_Base_createWindowLayer.call(this);
    this.createEffekseerLayer();
};
Scene_Base.prototype.createEffekseerLayer =function(){
    if(effekseerRendererObject){
        this.addChild(effekseerRendererObject);
    }
};


const Scene_Base_update=Scene_Base.prototype.update;
Scene_Base.prototype.update =function(){
    EffekseerManager.update();
    Scene_Base_update.call(this);
};

var effekseerRendererObject =null;
const zz_Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages= function() {
    zz_Scene_Boot_loadSystemImages.apply(this,arguments);
    effekseer.init(Graphics._renderer.gl);
    effekseerRendererObject = new PIXI.EffekseerRenderer();
};

const Game_CharacterBase_initMembers =Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function(){
    Game_CharacterBase_initMembers.call(this);
    this._effekseer=null;
};
Game_CharacterBase.prototype.startEffekseer =function(){
    this._effekseer=null;
    this._animationPlaying=true;
};
// Game_CharacterBase.prototype.endEffekseer =function(){
//     this._effekseerPlaying =false;
// };
Game_CharacterBase.prototype.requestEffekseer =function(name){
    this._effekseer=name;
};
Game_CharacterBase.prototype.isEffekseerPlaying =function(){
    return this._effekseer !==null || this._animationPlaying;
};

const Sprite_Character_update= Sprite_Character.prototype.update;
Sprite_Character.prototype.update= function(){
    Sprite_Character_update.call(this);
    this.updateEffekseer();
};
Sprite_Character.prototype.startEffekseer =function(filePath){
    const efk = new Sprite_Effekseer(filePath);
    this.parent.addChild(efk);
    const x= this.x;
    const y = this.y;
    EffekseerManager.addEffect(efk,function(e){
        e.setLocation(x,y,0 );
    },x,y);
    this._animationSprites.push(efk);
};
Sprite_Character.prototype.setupEffekseer=function(){
    if(this._character._effekseer){
        this.startEffekseer (EffekseerManager.toFilePath( this._character._effekseer ) );        
        this._character.startEffekseer();
    }
};
Sprite_Character.prototype.updateEffekseer=function(){
    this.setupEffekseer();
};

const Game_Interpreter_updateWaitMode =Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode =function(){
    var result =false;
    if(this._waitMode ===effekseerStr){
        result =  this._character.isEffekseerPlaying();
        if(!result){
            this._waitMode ='';
        }
        return result;
    }
    return  Game_Interpreter_updateWaitMode.call(this) ;
};

Game_Interpreter.prototype.effekseerNew =function(name,character,needWait){
    this._character =character;

    character.requestEffekseer( name);
    if(needWait){
        this.setWaitMode( effekseerStr );
    }
};


const Game_Interpreter_pluginCommand=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    if(command ==='effekseer'){
        const name = args[0];
        switch (name) {
            case 'new':
            this.effekseerNew(args[1],this.character(Number(args[2])),args[3]==='wait' );
                break;
        
            default:
                break;
        }
    }else{
        Game_Interpreter_pluginCommand.apply(this,arguments);
    }
};
const effektList =[
    'Laser01',
    'Laser02',
    'block',
    'Simple_Ribbon_Parent',
    'Simple_Ribbon_Sword',
    'Simple_Ring_Shape1',
    'Simple_Sprite_FixedYAxis',
    'Simple_Track1',
];

class Window_efkSelect extends Window_Command{
    constructor(x,y,w,h){
        super(x,y);
    }
    makeCommandList(){
        for(var i=0; i < effektList.length; ++i){
            this.addCommand(effektList[i],'Resource/'+effektList[i]+'.efk' );
        }
    }
    windowWidth(){
        return 360;
    }
};



function setPosXX(efk){
    const x = efk.x;
    efk.x =336;
    efk.y = 436;

    efk.setRotation(90,0,0);    
}
class Scene_EffekseerTest extends Scene_ItemBase{
    constructor(){
        super();
        this._effect =[];
        this.count=0;
    }
    update(){
        super.update();        
    }
    createEnemy(){
        this._rootSprite =new Sprite_Base();
        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight;
        var x = (Graphics.width - width) / 2;
        var y = (Graphics.height - height) / 2;
        this._rootSprite.setFrame(x,y,width,height);

        this._enemy=new Game_Enemy(1,600,300);
        this._enemySprite=new Sprite_Enemy(this._enemy);
        this._rootSprite.addChild(this._enemySprite);
        this.addChild(this._rootSprite);
    }
    create(){
        super.create();
        this.createEffectSelectWindow();
        this.createEnemy();
    }

    createEffectSelectWindow(){
        const wc = new Window_efkSelect(0,0,400,400);
        wc.makeCommandList();

        wc.activate();
        wc.setHandler('ok',this.onEffectOK.bind(this));
        wc.setHandler( 'cancel',this.popScene.bind(this) );
        this.addWindow(wc);
        this._effectSelectWindow =wc;
    }

    onEffectOK(){
        this._effectSelectWindow.activate();
        const fileName = this._effectSelectWindow.currentSymbol();
        EffekseerManager.reserveEffect(fileName,function(e){
            const w= Graphics.boxWidth;
            const h= Graphics.boxHeight;
//            e.setPosition(w/2,h/2,0);
        });
    }
};




const zz_MA_sceneBase_Window_MenuCommand_addOriginalCommands=Window_MenuCommand.prototype.addOriginalCommands;
Window_MenuCommand.prototype.addOriginalCommands =function(){
    zz_MA_sceneBase_Window_MenuCommand_addOriginalCommands.call(this);
    this.addCommand( xxx.commandName,xxx.commandKey,true);
};

const zz_MA_sceneBase_Scene_Menu_createCommandWindow=Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    zz_MA_sceneBase_Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler(xxx.commandKey, this.commandBattleHistory.bind(this) );

};

//アクター一人を選択する場合のみ、ここを有効にする
const zz_MA_scene_Scene_Menu_onPersonalOk=Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk =function(){
    if( this._commandWindow.currentSymbol() ===xxx.commandKey  ){
        console.log('nnn');
        SceneManager.push(_Scene_);
    }else{
        zz_MA_scene_Scene_Menu_onPersonalOk.call(this);
    }
}


Scene_Menu.prototype.commandBattleHistory = function(){
        SceneManager.push(Scene_EffekseerTest);
};
const Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
Scene_Battle.prototype.isAnyInputWindowActive =function(){
    return Scene_Battle_isAnyInputWindowActive.call(this) ||
     this._effectSelectWindow.active;

};

const Window_PartyCommand_makeCommandList =Window_PartyCommand.prototype.makeCommandList;
Window_PartyCommand.prototype.makeCommandList =function(){
    Window_PartyCommand_makeCommandList.call(this);
        this.addCommand('effekseer','efk');
};
Scene_Battle.prototype.commandEffekseer =function(){
    this._effectSelectWindow.refresh();
    this._effectSelectWindow.show();
    this._effectSelectWindow.activate();

};
const Scene_Battle_createAllWindows =Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows=function(){
    Scene_Battle_createAllWindows.call(this);
    this.createEffectSelectWindow();

};


Scene_Battle.prototype.createEffectSelectWindow=function(){
    const wc = new Window_efkSelect(0,0,400,400);
    wc.makeCommandList();
    wc.hide();

    wc.deactivate();
    wc.setHandler('ok',this.onEffectOK.bind(this));
//    wc.setHandler( 'cancel',this.popScene.bind(this) );
    this.addWindow(wc);
    this._effectSelectWindow =wc;
    this._partyCommandWindow.setHandler('efk',this.commandEffekseer.bind(this));
};
//Scene_Battle.prototype.
Scene_Battle.prototype.onEffectOK =function(){
    this._effectSelectWindow.activate();
    const fileName = this._effectSelectWindow.currentSymbol();
    EffekseerManager.reserveEffect(fileName,setPosXX);
};

if(!Array.prototype.find){
Array.prototype.find =function(func){
    for(var i=0;i < this.length; i+=1){
        if( func( this[i])){
            return this[i];
        }
    }
    return undefined;
};
}


})(this);
