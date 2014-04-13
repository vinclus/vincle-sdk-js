/**
 * [VincluLed ウィンクル操作用クラス]
 */
var VincluLed = function(_frequencyL , _frequencyR){
    /**
     * [self 自身への参照]
     * @type {[Vincle]}
     */
    var self = this;

    /**
     * [const 定数群]
     * @type {Object}
     */
    this.const = {
        'ON' : 'on',
        'OFF' : 'off',
        'BLINK' : 'blink'
    };

    /**
     * [isDebugMode デバッグモード切り替え]
     * @type {Boolean}
     */
    this.isDebugMode = true;

    /**
     * [debug デバッグ　デバッグモードがTrueの場合のみ使用可能]
     * @return {[type]} [description]
     */
    this.debug = function() {
        if (!self.isDebugMode) {
            return;
        }
        if (typeof console === 'object' && 'log' in window.console) {
            try {
                return window.console.log(arguments);
            } catch (e) {
                var args = Array.prototype.slice.apply(arguments);
                return window.console.log(args.join(' '));
            }
        }
    };

    this.debug.status = function(){
        self.debug({
            'frequencyL':self.getFrequencyL(),
            'frequencyR':self.getFrequencyR(),
            'isLightOn':self.isLightOn(),
            'status':self.getStatus()
        });
    };

    /**
     * [frequencyL privete 点灯頻度L]
     * @type {Number}
     */
    var frequencyL = 0;
    /**
     * [getFrequencyL 点灯頻度Lゲッター]
     * @return {[Integer]} [点灯頻度L]
     */
    this.getFrequencyL = function() {
        return frequencyL;
    };
    /**
     * [setFrequencyL 点灯頻度Lセッター]
     * @param {[Integer]} _frequencyL [点灯頻度L]
     */
    this.setFrequencyL = function(_frequencyL) {
        frequencyL = _frequencyL;
        if (self.isLightOn()) {
            self.createAudioNode();
        }
    };
    /**
     * [frequencyL privete 点灯頻度L]
     * @type {Number}
     */
    var frequencyR = 0;
    /**
     * [getFrequencyR 点灯頻度Rゲッター]
     * @return {[Integer]} [点灯頻度R]
     */
    this.getFrequencyR = function() {
        return frequencyR;
    };
    /**
     * [setFrequencyR 点灯頻度Rセッター]
     * @param {[Integer]} _frequencyR [点灯頻度R]
     */
    this.setFrequencyR = function(_frequencyR) {
        frequencyR = _frequencyR;
        if (self.isLightOn()) {
            self.createAudioNode();
        }
    };

    /**
     * [status privete 点灯状態]
     * @type {String}
     */
    var status = self.const.OFF;
    /**
     * [getStatus 状態ゲッター]
     * @return {[String]} [状態]
     */
    this.getStatus = function() {
        return status;
    };
    /**
     * [setStatus 状態セッター]
     * @param {[String]} _status [状態]
     */
    this.setStatus = function(_status) {
        if (typeof _status !== 'string') {
          return;
        }
        self.debug('set status : '+_status);
        status = _status;
    };
    /**
     * [isLightOn 点灯中かどうか]
     * @return {Boolean} [点灯:true 消灯：false]
     */
    this.isLightOn = function(){
        if (self.getStatus() === self.const.ON) {
            return true;
        }
        else {
            return false;
        }
    };

    /**
     * [audio_context オーディオコンテキスト]
     * @type {[webkitAudioContext]}
     */
    this.audio_context = null;
    /**
     * [audio_node サウンドソース]
     * @type {[AudioBufferSourceNode]}
     */
    this.audio_node = null;
    /**
     * [gain_node デスティネーション接続ノード]
     * @type {[GainNode]}
     */
    this.gain_node = null;


    /**
     * [createAudioDataBuffer 再生する音のバッファーを作成する]
     * @param  {[webkitAudioContext]} context オーディオコンテキスト
     * @param  {[Integer]} frequencyL 点滅頻度L
     * @param  {[Integer]} frequencyR 点滅頻度R
     * @return {[AudioBuffer]}
     */
    this.createAudioDataBuffer = function(){
        var context = self.audio_context;
        var s = context.samplingRate * 2;
        var buffer = context.createBuffer(2, s, context.samplingRate);
        var audioDataL = buffer.getChannelData(0);
        var audioDataR = buffer.getChannelData(1);
        for(var i = 0; i < audioDataL.length; i++){
            var l = Math.sin(2 * Math.PI * self.getFrequencyL() * i / context.samplingRate);
            var r = Math.sin(2 * Math.PI * self.getFrequencyR() * i / context.samplingRate);
            audioDataL[i] = l;
            audioDataR[i] = r*-1;
        }
        return buffer;
    };

    /**
     * [setBrightness 明るさ調整]
     * @param {[Integer]} volume
     */
    this.setBrightness = function(volume){
        if(self.gain_node === null){
            self.createAudioNode();
            self.gain_node = self.audio_context.createGainNode();
            self.audio_node.connect(self.gain_node);
            self.gain_node.connect(self.audio_context.destination);
        }
        self.gain_node.gain.value = volume;
    };

    /**
     * [on LEDの電源をON]
     * @return {[void]}
     */
    this.on = function(){
        self.debug('on');
        if(self.getStatus() == self.const.ON){
            return;
        }

        self.setStatus(self.const.ON);
        self.createAudioNode();
    };

    /**
     * [off LEDの電源をOFF]
     * @return {[void]}
     */
    this.off = function( ){
        if(self.getStatus() == self.const.ON){
            self.debug('off');
            self.setStatus(self.const.OFF);
            self.destroyAudioNode();
        }
    };

    /**
     * [createAudioNode オーディオノードを再作成]
     * @return {[void]}
     */
    this.createAudioNode = function(){
        // 既存のオーディオノードを破棄
        self.destroyAudioNode();
        //バッファーを設定
        self.audio_node = self.audio_context.createBufferSource();
        self.audio_node.buffer = self.createAudioDataBuffer(
            self.audio_context,
            self.getFrequencyL(),
            self.getFrequencyR()
        );
        self.audio_node.loop = true;
        self.audio_node.connect(self.audio_context.destination);
        self.audio_node.noteOn(0);
    };

    /**
     * [createAudioNode オーディオノードを破棄]
     * @return {[void]}
     */
    this.destroyAudioNode = function(){
        if(self.audio_node){
            self.audio_node.noteOff(0);
        }
        self.audio_node = null;
        self.gain_node = null;
    };

    // fixme: エフェクト関連の基底クラスをつくるべきかも

    /**
     * [effect エフェクト]
     * @type {Object}
     */
    this.effect = {};

    /**
     * [blink 点滅]
     * @type {Object}
     */
    this.effect.blink = {
        /**
         * エフェクト実行間隔
         */
        'interval' : false,
        /**
         * [点滅実行]
         */
        'on' : function(interval) {
            var that = this;
            var v = 0;
            var i = 0.1;

            that.interval = interval;
            var _blink = function(){
                if (!self.isLightOn() || !that.interval) {
                    that.off();
                    return;
                }
                setTimeout(function(){
                    v -= i;
                    if(v <= -0.5) {
                        i = -0.1;
                    }
                    else if(v >= 0.0){
                        i = 0.1;
                    }
                    //明るさ調整
                    self.setBrightness(v);
                    _blink();
                },that.interval);
            };
            _blink();
        },
        /**
         * [点滅終了]
         */
        'off' : function() {
            this.interval = false;
            // 明るさリセット
            self.setBrightness(1);
        }
    };

    /**
     * [init 初期化処理]
     * @param  {[Integer]} _frequencyL [点滅頻度L]
     * @param  {[Integer]} _frequencyR [点滅頻度R]
     * @return {[void]}
     */
    this.init = function(_frequencyL, _frequencyR){
        self.debug(_frequencyL, _frequencyR);
        self.setFrequencyL(_frequencyL);
        self.setFrequencyR(_frequencyR);
        var aCon = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        self.audio_context = new aCon();
        //44100 は変更しない事
        self.audio_context.samplingRate = 44100;
    };

    this.init(_frequencyL,_frequencyR);
};
