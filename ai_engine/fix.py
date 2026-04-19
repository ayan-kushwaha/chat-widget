import os

directory = 'c:/Users/Aryan/my/cluaiz/ai_engine/src/services/neural/neurons'
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'from src.services.neural.neurons.base_neuron.base_neuron import BaseNeuron' in content:
                new_content = content.replace(
                    'from src.services.neural.neurons.base_neuron.base_neuron import BaseNeuron',
                    'from src.services.neural.neurons.base_neuron import BaseNeuron'
                )
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")
