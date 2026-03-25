import librosa
import numpy as np

def extract_features(file_path):
    audio, sr = librosa.load(file_path, duration=5, offset=0.5)

    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc.T, axis=0)
    mfcc_var = np.var(mfcc.T, axis=0)

    delta = librosa.feature.delta(mfcc)
    delta_mean = np.mean(delta.T, axis=0)

    return np.hstack([mfcc_mean, mfcc_var, delta_mean])