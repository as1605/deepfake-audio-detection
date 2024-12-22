import { AutoFeatureExtractor, AutoModelForAudioClassification } from '@huggingface/transformers';
import * as fs from 'fs';
import * as wav from 'wav';
import { argMax } from '@tensorflow/tfjs-node';
import { CONFIG } from './config';

class AudioAIDetector {
  private featureExtractor: any;
  private model: any;

  async predict(wavFilePath: string): Promise<string> {
    if (!fs.existsSync(wavFilePath)) {
      throw new Error('File not found');
    }

    if (!this.featureExtractor) {
      this.featureExtractor = await AutoFeatureExtractor.from_pretrained(CONFIG.model, {});
    }
    if (!this.model) {
      this.model = await AutoModelForAudioClassification.from_pretrained(CONFIG.model);
    }

    const audioData = await this.readWavFile(wavFilePath);

    const { audioArray, samplingRate } = audioData;

    const inputs = await this.featureExtractor(audioArray, {
      sampling_rate: samplingRate,
      return_tensors: 'pt',
    });

    const output = await this.model(inputs);
    const logits = output.logits;
    const predictedClassId = argMax(logits.ort_tensor.cpuData, -1).dataSync()[0];

    const label = this.model.config.id2label[predictedClassId];
    return label;
  }

  private readWavFile(filePath: string): Promise<{ audioArray: Float32Array; samplingRate: number }> {
    return new Promise((resolve, reject) => {
      const reader = new wav.Reader();
      const fileStream = fs.createReadStream(filePath);
      const audioChunks: number[] = [];
      let samplingRate: number;

      reader.on('format', format => {
        samplingRate = format.sampleRate;
      });

      reader.on('data', chunk => {
        const data = new Int16Array(chunk.buffer);
        audioChunks.push(...data);
      });

      reader.on('end', () => {
        const audioArray = new Float32Array(audioChunks.map(v => v / 32768)); // Normalize to [-1, 1]
        resolve({ audioArray, samplingRate });
      });

      reader.on('error', err => reject(err));
      fileStream.pipe(reader);
    });
  }
}

export { AudioAIDetector };
