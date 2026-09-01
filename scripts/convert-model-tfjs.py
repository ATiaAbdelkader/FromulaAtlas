#!/usr/bin/env python3
"""
Convert the .keras model to TensorFlow.js format using a manual approach.
Instead of the tensorflowjs_converter CLI (which has dependency issues),
we load the model, extract weights, and write the model.json + weight binaries manually.
"""
import json
import os
import numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_USE_LEGACY_KERAS'] = '1'

# Force import after env vars
import tensorflow as tf

MODEL_PATH = '/tmp/plant_disease_model.keras'
OUTPUT_DIR = '/home/z/my-project/public/models/plant-disease'

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"Model loaded. Input shape: {model.input_shape}, Output shape: {model.output_shape}")
print(f"Layers: {len(model.layers)}")
for layer in model.layers:
    print(f"  {layer.__class__.__name__}: {layer.name} — weights: {len(layer.get_weights())}")

# Build the TF.js model.json spec
# See: https://www.tensorflow.org/js/guide/conversion
model_config = {
    "modelTopology": json.loads(model.to_json()),
    "format": "layers-model",
    "generatedBy": "Formula Atlas converter",
    "convertedBy": "manual script"
}

# Extract all weights into a single binary buffer
all_weights = []
weight_specs = []

for layer in model.layers:
    layer_weights = layer.get_weights()
    for i, w in enumerate(layer_weights):
        if w.size == 0:
            continue
        w_flat = w.flatten().astype('float32')
        all_weights.append(w_flat)
        weight_specs.append({
            "name": f"{layer.name}_{i}",
            "shape": list(w.shape),
            "dtype": "float32",
        })

# Concatenate all weights into one binary blob
concatenated = np.concatenate(all_weights)
weight_bytes = concatenated.tobytes()

# Write weights binary
weights_path = os.path.join(OUTPUT_DIR, 'weights.bin')
with open(weights_path, 'wb') as f:
    f.write(weight_bytes)

# Build the weights manifest
weights_manifest = {
    "paths": ["weights.bin"],
    "weights": weight_specs,
}

# Combine into final model.json
model_json = {
    "modelTopology": model_config["modelTopology"],
    "format": "layers-model",
    "generatedBy": "Formula Atlas",
    "convertedBy": "manual Python script",
    "weightsManifest": [weights_manifest],
}

# Write model.json
model_json_path = os.path.join(OUTPUT_DIR, 'model.json')
with open(model_json_path, 'w') as f:
    json.dump(model_json, f)

print(f"\nConversion complete!")
print(f"  model.json: {os.path.getsize(model_json_path)} bytes")
print(f"  weights.bin: {os.path.getsize(weights_path)} bytes ({os.path.getsize(weights_path)/1024/1024:.1f} MB)")
print(f"  Total weight entries: {len(weight_specs)}")
print(f"  Total parameters: {concatenated.size}")

# Also save the class names
class_names = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
    "Tomato_healthy",
]

class_names_path = os.path.join(OUTPUT_DIR, 'class_names.json')
with open(class_names_path, 'w') as f:
    json.dump(class_names, f, indent=2)

print(f"  class_names.json: {len(class_names)} classes")

# Verify by listing output files
print(f"\nOutput files in {OUTPUT_DIR}:")
for f in os.listdir(OUTPUT_DIR):
    path = os.path.join(OUTPUT_DIR, f)
    print(f"  {f}: {os.path.getsize(path)} bytes")
