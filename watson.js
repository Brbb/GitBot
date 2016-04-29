var watson = require('watson-developer-cloud');
var fs = require('fs');

var speech_to_text = watson.speech_to_text({
    username: '5151834d-f4b1-43eb-bd0a-7ff4b553b516',
    password: 'vHQE5LSYpc75',
    version: 'v1'
});

var text_to_speech = watson.text_to_speech({
    username: 'e582b8c4-3b6c-40d8-8307-83c2ba233586',
    password: 'OMiI5gtW776I',
    version: 'v1'
});

var language_translation = watson.language_translation({
    username: 'd6a57b5f-910a-4fe4-b6ab-7833bbfb3132',
    password: 'vBbPekmJ6VEH',
    version: 'v2'
});

var exports = module.exports = {};

//'./res/input/f.oga'
exports.recognize = function (voiceFile, callback) {
    
    var outputVoiceFileName = voiceFile.split('.')[0].split('/').pop();
    
    speech_to_text.recognize({
        // From file
        audio: fs.createReadStream(voiceFile),
        content_type: 'audio/ogg; rate=44100'
    }, function (err, res) {
        if (err)
            console.log(err);
        else {
            console.log(JSON.stringify(res, null, 2));

            if (res.results.length < 1) {
                console.log("No results.");
            } else {

                var maxConfidence = 0;
                var message = '';

                res.results.forEach(function (result) {
                    result.alternatives.forEach(function (alternative) {
                        if (maxConfidence < alternative.confidence) {
                            maxConfidence = alternative.confidence;
                            message = alternative.transcript;
                        }
                    });
                });

                if (maxConfidence < 0.5) {
                    var message = 'Please repeat, try to speak slowly!';
                }

                language_translation.translate({
                        text: message,
                        source: 'en',
                        target: 'es'
                    },
                    function (err, translationRes) {
                        if (err)
                            console.log('error:', err);
                        else {
                            //console.log(JSON.stringify(translationRes, null, 2));
                            var translationText = translationRes.translations[0].translation;
                            console.log(translationText);

                            var tts_params = {
                                text: translationText,
                                voice: 'es-ES_EnriqueVoice'
                            };

                            console.log('Producing output file...');
                            var writeStream = fs.createWriteStream('resources/output/'+outputVoiceFileName+'.wav');
                            // Pipe the synthesized text to a file
                            text_to_speech.synthesize(tts_params).pipe(writeStream);
                            console.log('Produced output file.');
                            callback();
                        }
                    });
            }
        }

    });
}