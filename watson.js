var watson = require('watson-developer-cloud');
var fs = require('fs');

var speech_to_text = watson.speech_to_text({
    username: '<username>',
    password: '<password>',
    version: 'v1'
});

var text_to_speech = watson.text_to_speech({
    username: '<username>',
    password: '<password>',
    version: 'v1'
});

var language_translation = watson.language_translation({
    username: '<username>',
    password: '<password>',
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

            var maxConfidence = 0;
            var error = 'Please repeat, try to speak clearly!';
            var message = '';

            if (res.results.length < 1) {
                callback(error, null);
            } else {

                res.results.forEach(function (result) {
                    result.alternatives.forEach(function (alternative) {
                        if (maxConfidence < alternative.confidence) {
                            maxConfidence = alternative.confidence;
                            message = alternative.transcript;
                        }
                    });
                });

                if (maxConfidence < 0.5) {
                    error = 'Please repeat, try to speak slowly!';
                    callback(error, null);
                } else {

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
                                var outputVoiceFileNamePath = 'resources/output/' + outputVoiceFileName + '.wav';
                                var writeStream = fs.createWriteStream(outputVoiceFileNamePath);
                                // Pipe the synthesized text to a file
                                text_to_speech.synthesize(tts_params).pipe(writeStream);
                                writeStream.on('finish', function () {
                                    console.log('Produced output file.');
                                    callback(null, outputVoiceFileNamePath);
                                });
                            }
                        });
                }
            }
        }

    });
}
