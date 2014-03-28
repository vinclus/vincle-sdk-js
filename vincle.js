var VincluLed = function( frequencyL , frequencyR ){

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
     * 点滅頻度L
     * @type {[Integer]}
     */
    this.frequencyL = frequencyL;
    /**
     * 点滅頻度R
     * @type {[Integer]}
     */
    this.frequencyR = frequencyR;

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
     * [init 初期化処理]
     * @return {[void]}
     */
    this.init = function(){
        this.audio_context = new webkitAudioContext();
    //44100 は変更しない事
        this.audio_context.samplingRate = 44100;
    };

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
            var l = Math.sin(2 * Math.PI * frequencyL * i / context.samplingRate);
            var r = Math.sin(2 * Math.PI * frequencyR * i / context.samplingRate);
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
        console.log('on');
        this.isOn = true;   

        //バッファーを設定
        this.audio_node = this.audio_context.createBufferSource();
        this.audio_node.buffer = this.createAudioDataBuffer(this.audio_context,this.frequencyL,this.frequencyR);
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
            console.log('off');
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
        if(this.isBlink == false){
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
        //LED 消灯
        this.isBlink = false;
        clearInterval(this.blinkTimer);
        this.off();
    }

    this.init();
};
