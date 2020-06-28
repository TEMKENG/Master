import os
import numpy as np
from PIL import Image
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.datasets.mnist import load_data


def save_plot(examples, n=8):
    c = 4
    np.random.shuffle(examples)
    np.random.shuffle(examples)
    print("Save plot:", examples.shape)
    plt.figure(figsize=(10, 4))
    examples = examples.reshape((len(examples), 28, 28))
    for i in range(c * n):
        plt.subplot(c, n, 1 + i)
        plt.axis('off')
        plt.imshow(examples[i])
        # plt.gray()
    # save plot to file
    filename = 'models/generatorb2.png'
    plt.savefig(filename)
    plt.show()
    # plt.close()


latent_dim = 100
n_samples = 100
path = "GAN_20000/data/32_20000.h5"
model = tf.keras.models.load_model(path)
# file = "tester/smile_to_mnist.npy"
# file = np.load(file)
# save_plot(file)
x_input = np.random.randn(latent_dim * n_samples)
# L.Reshape into a batch of inputs for the network
x_input = x_input.reshape(n_samples, latent_dim)
predict = np.array(model(x_input))
save_plot(predict)
# path = "Bilder_Smileys"
#
# filenames = [os.path.join(path, file) for file in os.listdir(path)]
# imgs = []
# for file in filenames:
#     img = Image.open(file).convert("L")
#     # img = img.resize((28, 28))
#     img = np.array(img)
#     imgs.append(img)
# imgs = np.array(imgs)
# # imgs = np.expand_dims(imgs, -1)
# np.save("tester/orignal_smile.npy", imgs)
# save_plot(imgs, -1)
# (x_train, y_train), (x_test, y_test) = load_data()
# save_plot(x_test, 0)

# img = Image.open("models/Simple_Autoencoder_bild.PNG")
# img = img.resize((519, 219))
# img.save("models/Simple_Autoencoder_bild.PNG")
