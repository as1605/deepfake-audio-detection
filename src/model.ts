import { AutoFeatureExtractor, AutoModelForAudioClassification } from '@huggingface/transformers';
import { argMax } from '@tensorflow/tfjs-node';
import { CONFIG } from './config';

class AudioAIDetector {
  private featureExtractor: any;
  private model: any;

  async detect(audioArray: Float32Array, samplingRate: number): Promise<number> {
    const chunks = [];
    const chunkSize = CONFIG.chunkSize;
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      chunks.push(audioArray.subarray(i, i + chunkSize));
    }
    let score = 0;
    for (const chunk of chunks) {
      const label = await this.predict(chunk, samplingRate);
      console.log('Predicted Label:', label);
      if (label !== 'fake') {
        score += 1;
      }
    }
    return score / chunks.length;
  }

  async predict(audioArray: Float32Array, samplingRate: number): Promise<string> {
    if (!this.featureExtractor) {
      this.featureExtractor = await AutoFeatureExtractor.from_pretrained(CONFIG.model, {});
    }
    if (!this.model) {
      this.model = await AutoModelForAudioClassification.from_pretrained(CONFIG.model);
    }

    const inputs = await this.featureExtractor(audioArray, {
      sampling_rate: samplingRate,
      return_tensors: 'pt',
    });

    const output = await this.model(inputs);
    const logits = output.logits;
    console.log('Logits:', logits.ort_tensor.cpuData);
    const predictedClassId = argMax(logits.ort_tensor.cpuData, -1).dataSync()[0];

    const label = this.model.config.id2label[predictedClassId];
    return label;
  }
}

export { AudioAIDetector };
