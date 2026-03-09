import os

def load_time_distribution(model_path='time_kde_model.pkl'):
    if not os.path.exists(model_path):
        print(f"Error: The file {model_path} does not exist.")
        return None
    with open(model_path, 'rb') as f:
        kde = pickle.load(f)
    
    return kde
