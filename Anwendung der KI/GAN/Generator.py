import os
import shutil
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Model, Sequential

(x_train, _), (x_test, _) = tf.keras.datasets.mnist.load_data()
x_train = x_train.astype('float32') / 255.
x_test = x_test.astype('float32') / 255.
shutil.rmtree('GAN_new', ignore_errors=True)
os.makedirs('GAN_new/images', exist_ok=True)
os.makedirs('GAN_new/model', exist_ok=True)


def discriminator():
    x = inputs = tf.keras.Input(shape=(28 * 28))
    # x = Flatten()(x)
    x = Dense(32, activation="relu")(x)
    x = Dense(16, activation="relu")(x)
    x = Dense(1, activation='sigmoid')(x)
    model = Model(inputs, x, name="discriminator")
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

    return model


def generator(latent_dim=784):
    x = inputs = tf.keras.Input(shape=latent_dim)
    x = Dense(32, activation="relu")(x)
    x = Dense(784, activation="sigmoid")(x)
    model = Model(inputs, x, name="generaator")

    return model


def gan(g_model, d_model):
    d_model.trainable = False
    model = Sequential(name="gan")
    model.add(g_model)
    model.add(d_model)
    model.compile(loss='binary_crossentropy', optimizer=tf.keras.optimizers.Adam(lr=0.0002, beta_1=0.5))

    return model


def generate_real_samples(dataset, n_samples):
    ix = np.random.randint(0, dataset.shape[0], n_samples)
    X = dataset[ix]
    y = np.ones((n_samples, 1))
    return X.reshape((n_samples, 28 * 28)), y


def generate_fake_samples(g_model, latent_dim, n_samples):
    x_input = np.random.rand(n_samples, latent_dim)
    X = g_model.predict(x_input)
    y = np.zeros((n_samples, 1))
    return X, y


def train(g_model, d_model, gan_model, dataset, latent_dim, n_epochs=2000, n_batch=256):
    bat_per_epo = int(dataset.shape[0] / n_batch)
    half_batch = int(n_batch / 2)
    for i in range(n_epochs):
        for j in range(bat_per_epo):
            X_real, y_real = generate_real_samples(dataset, half_batch)
            X_fake, y_fake = generate_fake_samples(g_model, latent_dim, half_batch)
            X, y = np.vstack((X_real, X_fake)), np.vstack((y_real, y_fake))
            d_loss, _ = d_model.train_on_batch(X, y)
            X_gan = np.random.rand(n_batch, latent_dim)
            y_gan = np.ones((n_batch, 1))
            g_loss = gan_model.train_on_batch(X_gan, y_gan)
            # if (j + 1) == bat_per_epo:
            #     print('>%d, %d/%d, d=%.3f, g=%.3f' % (i + 1, j + 1, bat_per_epo, d_loss, g_loss))
        if (i + 1) % 100 == 0:
            summarize_performance(i, g_model, d_model, dataset, latent_dim)


def save_plot(examples, epoch, n=10):
    print("Save plot:", examples.shape)
    examples = examples.reshape((len(examples), 28, 28))
    for i in range(n * n):
        plt.subplot(n, n, 1 + i)
        plt.axis('off')
        plt.imshow(examples[i], cmap='gray')
    # save plot to file
    filename = 'GAN_new/images/generated_plot_e%03d.png' % (epoch + 1)
    plt.savefig(filename)
    plt.close()


# evaluate the discriminator, plot generated images, save generator model
def summarize_performance(epoch, g_model, d_model, dataset, latent_dim, n_samples=100):
    dataset = x_test
    X_real, y_real = generate_real_samples(dataset, n_samples)
    _, acc_real = d_model.evaluate(X_real, y_real, verbose=1)
    x_fake, y_fake = generate_fake_samples(g_model, latent_dim, n_samples)
    _, acc_fake = d_model.evaluate(x_fake, y_fake, verbose=1)
    print('>Accuracy real: %.0f%%, fake: %.0f%%' % (acc_real * 100, acc_fake * 100))
    save_plot(x_fake, epoch)
    filename = 'GAN_new/model/generator_model_%03d.h5' % (epoch + 1)
    g_model.save(filename)


latent_dim = 784
d_model = discriminator()
g_model = generator(latent_dim=latent_dim)
gan_model = gan(g_model, d_model)
train(g_model, d_model, gan_model, x_train, latent_dim)
