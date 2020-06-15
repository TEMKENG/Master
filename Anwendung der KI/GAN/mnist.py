# example of training a gan on mnist
import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import Utils

MY_BATCH = 100
gen = Utils.get_generator()
print('number of element: ', gen.n)
L = tf.keras.layers
# os.environ['CUDA_VISIBLE_DEVICES'] = '0,2, 3'
os.makedirs("GAN", exist_ok=True)
# define the standalone discriminator model


def define_discriminator(in_shape=(28, 28, 1)):
    model = tf.keras.models.Sequential()
    model.add(L.Conv2D(64, (3, 3), strides=(2, 2),
                       padding='same', input_shape=in_shape))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Dropout(0.4))
    model.add(L.Conv2D(64, (3, 3), strides=(2, 2), padding='same'))
    model.add(L.LeakyReLU(alpha=0.2))
    model.add(L.Dropout(0.4))
    model.add(L.Flatten())
    model.add(L.Dense(1, activation='sigmoid'))
    # compile model
    opt = tf.keras.optimizers.Adam(lr=0.0002, beta_1=0.5)
    model.compile(loss='binary_crossentropy',
                  optimizer=opt, metrics=['accuracy'])
    return model

# define the standalone generator model


def define_generator(latent_dim):
    model = tf.keras.models.Sequential()
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
    model = tf.keras.models.Sequential()
    # add generator
    model.add(g_model)
    # add the discriminator
    model.add(d_model)
    # compile model
    opt = tf.keras.optimizers.Adam(lr=0.0002, beta_1=0.5)
    model.compile(loss='binary_crossentropy', optimizer=opt)
    return model

# load and prepare mnist training images


def load_real_samples():
    # load mnist dataset
    (trainX, _), (_, _) = tf.keras.datasets.mnist.load_data()
    generator_for_all = Utils.get_generator(batch_size=MY_BATCH)

    # expand to 3d, e.g. add channels dimension
    X = np.expand_dims(trainX, axis=-1)
    # convert from unsigned ints to floats
    X = X.astype('float32')
    # scale from [0,255] to [0,1]
    X = X / 255.0
    return X

# select real samples


def generate_real_samples(n_samples):
    # choose random instances
    ix = np.random.randint(0, gen.n, n_samples)
    # retrieve selected images
    x, _ = Utils.get_generator(batch_size=gen.n)
    x = x[ix]
    # generate 'real' class labels (1)
    y = np.ones((n_samples, 1))
    return x, y

# generate points in latent space as input for the generator


def generate_latent_points(latent_dim, n_samples):
    # generate points in the latent space
    x_input = np.random.randn(latent_dim * n_samples)
    # L.Reshape into a batch of inputs for the network
    x_input =x_input.reshape((n_samples, latent_dim))
    return x_input

# use the generator to generate n fake examples, with class labels
def generate_fake_samples(g_model, latent_dim, n_samples):
    # generate points in latent space
    x_input = generate_latent_points(latent_dim, n_samples)
    # predict outputs
    X = g_model.predict(x_input)
    # create 'fake' class labels (0)
    y = np.zeros((n_samples, 1))
    return X, y

# create and save a plot of generated images (reversed grayscale)


def save_plot(examples, epoch, n=10):
    # plot images
    for i in range(n * n):
        # define subplot
        plt.subplot(n, n, 1 + i)
        # turn off axis
        plt.axis('off')
        # plot raw pixel data
        plt.imshow(examples[i, :, :, 0], cmap='gray_r')
    # save plot to file
    filename = 'GAN/generated_plot_e%03d.png' % (epoch+1)
    plt.savefig(filename)
    plt.close()

# evaluate the discriminator, plot generated images, save generator model


def summarize_performance(epoch, g_model, d_model, dataset, latent_dim, n_samples=100):
    # prepare real samples
    X_real, y_real = generate_real_samples( n_samples)
    # evaluate discriminator on real examples
    _, acc_real = d_model.evaluate(X_real, y_real, verbose=0)
    # prepare fake examples
    x_fake, y_fake = generate_fake_samples(g_model, latent_dim, n_samples)
    # evaluate discriminator on fake examples
    _, acc_fake = d_model.evaluate(x_fake, y_fake, verbose=0)
    # summarize discriminator performance
    print('>Accuracy real: %.0f%%, fake: %.0f%%' %
          (acc_real*100, acc_fake*100))
    # save plot
    save_plot(x_fake, epoch)
    # save the generator model tile file
    filename = 'GAN/generator_model_%03d.h5' % (epoch + 1)
    g_model.save(filename)

# train the generator and discriminator


def train(g_model, d_model, gan_model, dataset, latent_dim, n_epochs=1000, n_batch=400):
    bat_per_epo = int(dataset.shape[0] / n_batch)
    half_batch = int(n_batch / 2)
    # manually enumerate epochs
    for i in range(n_epochs):
        # enumerate batches over the training set
        for j in range(bat_per_epo):
            # get randomly selected 'real' samples
            # X_real, y_real = generate_real_samples(dataset, half_batch)
            X_real, y_real = generate_real_samples(dataset, half_batch)
            y_real = np.ones((n_samples, 1))
            # generate 'fake' examples
            X_fake, y_fake = generate_fake_samples(
                g_model, latent_dim, half_batch)
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
            print('>%d, %d/%d, d=%.3f, g=%.3f' %
                  (i+1, j+1, bat_per_epo, d_loss, g_loss))
        # evaluate the model performance, sometimes
        if (i+1) % 10 == 0:
            summarize_performance(i, g_model, d_model, dataset, latent_dim)


# size of the latent space
latent_dim = 100
# create the discriminator
d_model = define_discriminator()
# create the generator
g_model = define_generator(latent_dim)
# create the gan
gan_model = define_gan(g_model, d_model)
# load image data
# train model
# train(g_model, d_model, gan_model, dataset, latent_dim)
d_model.summary()
