/**
 * [VincluLed ウィンクル操作用クラス]
 */
var VincluLed = function(_frequencyL , _frequencyR){
    /**
     * [self 自身への参照]
     * @type {[Vincle]}
     */
    var self = this;

    this.const = {
        'ON' : 'on',
        'OFF' : 'off',
        'BLINK' : 'blink'
    }

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
    }

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
    }
    /**
     * [setFrequencyL 点灯頻度Lセッター]
     * @param {[Integer]} _frequencyL [点灯頻度L]
     */
    this.setFrequencyL = function(_frequencyL) {
        frequencyL = _frequencyL;
    }
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
    }
    /**
     * [setFrequencyR 点灯頻度Rセッター]
     * @param {[Integer]} _frequencyR [点灯頻度R]
     */
    this.setFrequencyR = function(_frequencyR) {
        frequencyR = _frequencyR;
    }

    /**
     * [isOn 点灯中か]
     * @type {Boolean}
     */
    this.isOn = false;
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
     * [isBlink 点滅中か]
     * @type {Boolean}
     */
    this.isBlink = false;


    /**
     * [createAudioDataBuffer 再生する音のバッファーを作成する]
     * @param  {[webkitAudioContext]} context オーディオコンテキスト
     * @param  {[Integer]} frequencyL 点滅頻度L
     * @param  {[Integer]} frequencyR 点滅頻度R
     * @return {[AudioBuffer]}
     */
    this.createAudioDataBuffer = function(context,frequencyL,frequencyR){
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
     * 
     */
    this.setBrightness = function(volume){
        if(this.gain_node == null){
            this.gain_node = this.audio_context.createGainNode();
            this.audio_node.connect(this.gain_node);
            this.gain_node.connect(this.audio_context.destination);
        }
        this.gain_node.gain.value = volume;
    }

    /**
     * [on LEDの電源をON]
     * @return {[void]}
     */
    this.on = function(){
        self.debug('on');
        if(( this.isOn )||(this.audio_node != null)){
            return;
        }
        this.isOn = true;   

        //バッファーを設定
        this.audio_node = this.audio_context.createBufferSource();
        this.audio_node.buffer = this.createAudioDataBuffer(
            this.audio_context,
            self.getFrequencyL(),
            self.getFrequencyR()
        );
        this.audio_node.loop = true;
        this.audio_node.connect(this.audio_context.destination);

        this.audio_node.noteOn(0);
    };

    /**
     * [off LEDの電源をOFF]
     * @return {[void]}
     */
    this.off = function( ){
        if( this.isOn ){
            self.debug('off');
            this.isOn = false;
            this.audio_node.noteOff(0);
            this.audio_node = null;
            this.gain_node = null;
        }
    };

    /**
     * [blinkOn LEDの点滅開始]
     * @param  {[Integer]} interval 点灯間隔
     * @return {[void]}
     */
    this.blinkOn = function( interval ){
        if((this.isBlink == false) && (this.blinkTimer == null)){
            this.isBlink = true;
            //LED 点灯
            this.on();
            var v = 0,i= 0.1;
            var fnc = function(){
                v -= i;
                if(v <= -0.5) i = -0.1;
                else if(v >= 0.0) i = 0.1;
                //明るさ調整
                this.setBrightness(v);
            };
            this.blinkTimer = setInterval($.proxy(fnc,this),interval);
        }
    }

    /**
     * [blinkOn LEDの点滅終了]
     * @return {[void]}
     */
    this.blinkOff = function(){
    if(this.blinkTimer == null) return;
        //LED 消灯
        clearInterval(this.blinkTimer);
        this.blinkTimer = null;
        this.isBlink = false;
        this.off();
    }

    /**
     * [init 初期化処理]
     * @return {[void]}
     */
    this.init = function(_frequencyL, _frequencyR){
        self.debug(_frequencyL, _frequencyR)
        self.setFrequencyL(_frequencyL);
        self.setFrequencyR(_frequencyR);
        this.audio_context = new webkitAudioContext();
        //44100 は変更しない事
        this.audio_context.samplingRate = 44100;
    };

    this.init(_frequencyL,_frequencyR);
};
