import { AudioAIDetector } from './model';

console.log('Hello World!');
(async () => {
  const detector = new AudioAIDetector();
  const prediction = await detector.predict('data/obama-trimmed.wav');
  console.log('Predicted Label:', prediction);
})();
