import * as wav from 'node-wav';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { CONFIG } from './config';

class AudioInput {
  private tmpFiles: string[] = [];

  public async readFile(filePath: string): Promise<{ audioArray: Float32Array; samplingRate: number }> {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    if (filePath.endsWith('.wav')) {
      return this.readWavFile(filePath);
    }

    // try {
    const wavPath = await this.audioToWav(filePath);
    console.log('WAV Path:', wavPath);
    return this.readWavFile(wavPath);
    // } catch (err) {
    //   throw new Error('Error converting file to WAV');
    // }
  }

  private audioToWav(filePath: string): Promise<string> {
    if (!fs.existsSync(CONFIG.tmpDir)) {
      fs.mkdirSync(CONFIG.tmpDir, { recursive: true });
    }
    const wavPath = CONFIG.tmpDir + '/' + uuidv4() + '.wav';
    this.tmpFiles.push(wavPath);
    return new Promise((resolve, reject) =>
      ffmpeg(filePath)
        .toFormat('wav')
        .save(wavPath)
        .on('end', () => resolve(wavPath))
        .on('error', reject),
    );
  }

  private readWavFile(filePath: string): { audioArray: Float32Array; samplingRate: number } {
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);

    // Taking first channel
    return { audioArray: result.channelData[0], samplingRate: result.sampleRate };
  }

  public cleanup() {
    this.tmpFiles.forEach(fs.unlinkSync);
  }
}
export { AudioInput };
