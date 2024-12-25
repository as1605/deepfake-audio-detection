import { AudioInput } from './input';
import { AudioAIDetector } from './model';

const FILE = 'data/obama-trimmed.wav';

const detector = new AudioAIDetector();
const audio = new AudioInput();

console.log('Reading file:', FILE);

audio
  .readFile(FILE)
  .then(({ audioArray, samplingRate }) =>
    detector
      .detect(audioArray, samplingRate)
      .then(label => console.log(`Audio is ${label > 0.5 ? 'REAL' : 'FAKE'} with score: ${label}`)),
  )
  .finally(audio.cleanup);
