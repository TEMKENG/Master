# example of training a gan on mnist
import os
import shutil
import numpy as np
import pandas as pd
import tensorflow as tf
from matplotlib import pyplot
from collections import defaultdict
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.models import Sequential
# os.environ['CUDA_VISIBLE_DEVICES'] = '0,2, 3'
import Utils

L = tf.keras.layers
BATCH_SIZE = 32
# generator_for_all = Utils.get_generator(batch_size=BATCH_SIZE, image_size=(28, 28))
# nb_img = generator_for_all.n
if os.path.exists('GAN'):
    shutil.rmtree('GAN')
os.makedirs("GAN/images", exist_ok=True)
os.makedirs("GAN/data", exist_ok=True)

stat = defaultdict(list)


# define the standalone discriminator model
def define_discriminator(in_shape=(28, 28, 1)):
    model = Sequential()
    model.add(L.Conv2D(64, (3, 3), strides=(2, 2), padding='same', input_shape=in_shape))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Dropout(0.4))
    model.add(L.Conv2D(64, (3, 3), strides=(2, 2), padding='same'))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Dropout(0.4))
    model.add(L.Flatten())
    model.add(L.Dense(1, activation='sigmoid'))
    # compile model
    opt = Adam(lr=0.0001, beta_1=0.5)
    model.compile(loss='binary_crossentropy', optimizer=opt, metrics=['accuracy'])
    return model


# define the standalone generator model
def define_generator(latent_dim):
    model = Sequential()
    # foundation for 7x7 image
    n_nodes = 128 * 7 * 7
    model.add(L.Dense(n_nodes, input_dim=latent_dim))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Reshape((7, 7, 128)))
    # upsample to 14x14
    model.add(L.Conv2DTranspose(128, (4, 4), strides=(2, 2), padding='same'))
    model.add(L.LeakyReLU(alpha=0.2))
    # upsample to 28x28
    model.add(L.Conv2DTranspose(128, (4, 4), strides=(2, 2), padding='same'))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Conv2D(1, (7, 7), activation='sigmoid', padding='same'))
    return model


# define the combined generator and discriminator model, for updating the generator
def define_gan(g_model, d_model):
    # make weights in the discriminator not trainable
    d_model.trainable = False
    # connect them
    model = Sequential()
    # add generator
    model.add(g_model)
    # add the discriminator
    model.add(d_model)
    # compile model
    # opt = Adam(lr=0.0002, beta_1=0.5)
    opt = Adam(lr=0.0001, beta_1=0.5)
    model.compile(loss='binary_crossentropy', optimizer=opt)
    return model


# load and prepare the training images
def load_real_samples():
    # train_x, _ = next(Utils.get_generator(directory='data', image_size=(28, 28), batch_size=nb_img))
    # train_x = Utils.crops()
    train_x = np.load("smile_to_mnist.npy")
    train_x = train_x.astype('float32')
    return train_x


# select real samples
def generate_real_samples(dataset, n_samples):
    # choose random instances
    ix = np.random.randint(0, dataset.shape[0], n_samples)
    # retrieve selected images
    x = dataset[ix]
    # generate 'real' class labels (1)
    y = np.ones((n_samples, 1))
    return x, y


# generate points in latent space as input for the generator
def generate_latent_points(latent_dim, n_samples):
    # generate points in the latent space
    x_input = np.random.randn(latent_dim * n_samples)
    # L.Reshape into a batch of inputs for the network
    x_input = x_input.reshape(n_samples, latent_dim)
    return x_input


# use the generator to generate n fake examples, with class labels
def generate_fake_samples(g_model, latent_dim, n_samples):
    # generate points in latent space
    x_input = generate_latent_points(latent_dim, n_samples)
    # predict outputs
    x = g_model.predict(x_input)
    # create 'fake' class labels (0)
    y = np.zeros((n_samples, 1))
    return x, y


# create and save a plot of generated images (reversed grayscale)
def save_plot(examples, epoch, n=8):
    # plot images
    for i in range(n * n):
        # define subplot
        pyplot.subplot(n, n, 1 + i)
        # turn off axis
        pyplot.axis('off')
        # plot raw pixel data
        # pyplot.imshow(examples[i, :, :, 0], cmap='gray_r')
        pyplot.imshow(examples[i, :, :, 0], cmap="gray")
    # save plot to file
    filename = 'GAN/images/' + str(BATCH_SIZE) + '_e%03d.png' % (epoch + 1)
    pyplot.savefig(filename)
    pyplot.close()


# evaluate the discriminator, plot generated images, save generator model
def summarize_performance(epoch, g_model, d_model, dataset, latent_dim, n_samples=100):
    # prepare real samples
    X_real, y_real = generate_real_samples(dataset, n_samples)
    # evaluate discriminator on real examples
    _, acc_real = d_model.evaluate(X_real, y_real, verbose=0)
    # prepare fake examples
    x_fake, y_fake = generate_fake_samples(g_model, latent_dim, n_samples)
    # evaluate discriminator on fake examples
    _, acc_fake = d_model.evaluate(x_fake, y_fake, verbose=0)
    # summarize discriminator performance
    print('>Accuracy real: %.0f%%, fake: %.0f%%' % (acc_real * 100, acc_fake * 100))
    stat['r_acc'].append(acc_real)
    stat['f_acc'].append(acc_fake)
    # save plot
    save_plot(x_fake, epoch)
    # save the generator model tile file
    filename = 'GAN/data/' + str(BATCH_SIZE) + '_%03d.h5' % (epoch + 1)
    g_model.save(filename)


# train the generator and discriminator
def train(g_model, d_model, gan_model, dataset, latent_dim, n_epochs=20000, n_batch=50):
    bat_per_epo = int(dataset.shape[0] / n_batch)
    half_batch = int(n_batch / 2)
    # manually enumerate epochs
    for i in range(n_epochs):
        # enumerate batches over the training set
        for j in range(bat_per_epo):
            # get randomly selected 'real' samples
            X_real, y_real = generate_real_samples(dataset, half_batch)
            # generate 'fake' examples
            X_fake, y_fake = generate_fake_samples(g_model, latent_dim, half_batch)
            # create training set for the discriminator
            X, y = np.vstack((X_real, X_fake)), np.vstack((y_real, y_fake))
            # update discriminator model weights
            d_loss, _ = d_model.train_on_batch(X, y)
            # prepare points in latent space as input for the generator
            X_gan = generate_latent_points(latent_dim, n_batch)
            # create inverted labels for the fake samples
            y_gan = np.ones((n_batch, 1))
            # update the generator via the discriminator's error
            g_loss = gan_model.train_on_batch(X_gan, y_gan)
            # summarize loss on this batch
            # print('>%d, %d/%d, d=%.3f, g=%.3f' % (i + 1, j + 1, bat_per_epo, d_loss, g_loss))
        # evaluate the model performance, sometimes
        if (i + 1) % 1000 == 0:
            summarize_performance(i, g_model, d_model, dataset, latent_dim)
    df = pd.DataFrame.from_dict(stat)
    df.to_csv(str(BATCH_SIZE) + 'gan_smile.txt')


# size of the latent space
latent_dim = 100
# create the discriminator
d_model = define_discriminator()
# create the generator
g_model = define_generator(latent_dim)
# create the gan
gan_model = define_gan(g_model, d_model)
# load image data
dataset = load_real_samples()
# train model
train(g_model, d_model, gan_model, dataset, latent_dim)

if __name__ == '__main__':
    pass
