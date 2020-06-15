# example of pix2pix gan for satellite to map image-to-image translation
import os
import Utils
import numpy as np
import tensorflow as tf
from tensorflow.keras import Input
from matplotlib import pyplot as plt
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.layers import Activation
from tensorflow.keras.initializers import RandomNormal

MY_BATCH = 32
IMAGE_SIZE = 512
L = tf.keras.layers
BILD_PRO_GENERATOR = 4
# os.environ['CUDA_VISIBLE_DEVICES'] = '0'
if not os.path.exists('Smiley_Herz'):
    Utils.split_dataset()
generator_for_all = Utils.get_generator(batch_size=MY_BATCH)
generators = Utils.get_generators(batch_size=BILD_PRO_GENERATOR)

os.makedirs('generate/data', exist_ok=True)
os.makedirs('generate/model', exist_ok=True)


# define the discriminator model
def define_discriminator(image_shape=(IMAGE_SIZE, IMAGE_SIZE, BILD_PRO_GENERATOR)):
    init = RandomNormal(stddev=0.02)
    # source image input
    in_src_image = Input(shape=image_shape, name='d_input')
    # target image input
    in_target_image = Input(shape=image_shape, name='d_output')
    # L.Concatenate images channel-wise
    merged = L.Concatenate()([in_src_image, in_target_image])
    # C64
    d = L.Conv2D(64, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(merged)
    d = L.LeakyReLU(alpha=0.2)(d)
    # C128
    d = L.Conv2D(128, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(d)
    d = L.BatchNormalization()(d)
    d = L.LeakyReLU(alpha=0.2)(d)
    # C256
    d = L.Conv2D(256, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(d)
    d = L.BatchNormalization()(d)
    d = L.LeakyReLU(alpha=0.2)(d)
    # C512
    d = L.Conv2D(512, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(d)
    d = L.BatchNormalization()(d)
    d = L.LeakyReLU(alpha=0.2)(d)
    # second last output layer
    d = L.Conv2D(512, (4, 4), padding='same', kernel_initializer=init)(d)
    d = L.BatchNormalization()(d)
    d = L.LeakyReLU(alpha=0.2)(d)
    # patch output
    d = L.Conv2D(1, (4, 4), padding='same', kernel_initializer=init)(d)
    patch_out = Activation('sigmoid')(d)
    # define model
    model = Model([in_src_image, in_target_image], patch_out)
    # compile model
    opt = Adam(lr=0.0002, beta_1=0.5)
    model.compile(loss='binary_crossentropy', optimizer=opt, loss_weights=[0.5])
    return model


# define an encoder block
def define_encoder_block(layer_in, n_filters, batchnorm=True):
    init = RandomNormal(stddev=0.02)
    g = L.Conv2D(n_filters, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(layer_in)
    if batchnorm:
        g = L.BatchNormalization()(g)
    g = L.LeakyReLU(alpha=0.2)(g)
    return g


# define a decoder block
def decoder_block(layer_in, skip_in, n_filters, dropout=True):
    init = RandomNormal(stddev=0.02)
    g = L.Conv2DTranspose(n_filters, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(layer_in)
    g = L.BatchNormalization()(g)
    if dropout:
        g = L.Dropout(0.5)(g)
    g = L.Concatenate()([g, skip_in])
    g = L.LeakyReLU()(g)
    return g


# define the standalone generator model
def define_generator(image_shape=(IMAGE_SIZE, IMAGE_SIZE, 1)):
    init = RandomNormal(stddev=0.02)
    in_image = Input(shape=image_shape, name='g_input')
    e1 = define_encoder_block(in_image, 64, batchnorm=False)
    e2 = define_encoder_block(e1, 128)
    e3 = define_encoder_block(e2, 256)
    e4 = define_encoder_block(e3, 512)
    e5 = define_encoder_block(e4, 512)
    e6 = define_encoder_block(e5, 512)
    e7 = define_encoder_block(e6, 512)
    # bottleneck, no batch norm and relu
    b = L.Conv2D(512, (4, 4), strides=(2, 2), padding='same', activation='relu', kernel_initializer=init)(e7)
    # ~ b = Activation('relu')(b)
    # decoder model
    d1 = decoder_block(b, e7, 512)
    d2 = decoder_block(d1, e6, 512)
    d3 = decoder_block(d2, e5, 512)
    d4 = decoder_block(d3, e4, 512, dropout=False)
    d5 = decoder_block(d4, e3, 256, dropout=False)
    d6 = decoder_block(d5, e2, 128, dropout=False)
    d7 = decoder_block(d6, e1, 64, dropout=False)
    # output
    g = L.Conv2DTranspose(4, (4, 4), strides=(2, 2), padding='same', kernel_initializer=init)(d7)
    out_image = Activation('tanh')(g)
    # define model
    model = Model(in_image, out_image)
    return model


# define the combined generator and discriminator model, for updating the generator
def define_gan(g_model, d_model, image_shape_g, image_shape_d):
    # make weights in the discriminator not trainable
    d_model.trainable = False
    # define the source image
    in_src_g = Input(shape=image_shape_g)
    in_src_d = Input(shape=image_shape_d)
    # connect the source image to the generator input
    gen_out = g_model(in_src_g)
    # connect the source input and generator output to the discriminator input
    dis_out = d_model([in_src_d, gen_out])
    # src image as input, generated image and classification output
    model = Model([in_src_g, in_src_d], [dis_out, gen_out])
    # compile model
    opt = Adam(lr=0.0002, beta_1=0.5)
    model.compile(loss=['binary_crossentropy', 'mae'], optimizer=opt, loss_weights=[1, 100])
    return model


def generate_real_samples(patch_shape):
    X, Y = next(generator_for_all)
    results_X = list()
    results_Y = list()
    results_Z = list()
    for i in range(len(X)):
        results_X.append(X[i])
        results_Z.append(get_data(int(Y[i])))
        results_Y.append(get_data(int(Y[i])))
    y = np.ones((MY_BATCH, patch_shape, patch_shape, 1))
    results_Y = np.asarray(results_Y)
    results_Z = np.asarray(results_Z)
    if np.size(results_Z) == 5:
        for i in results_Z:
            print(i.shape)
    print(results_Z.shape)
    results_Y = results_Y.reshape((len(results_Y), IMAGE_SIZE, IMAGE_SIZE, BILD_PRO_GENERATOR))
    results_Z = results_Z.reshape((len(results_Z), IMAGE_SIZE, IMAGE_SIZE, BILD_PRO_GENERATOR))
    return [np.asarray(results_X), results_Y, results_Z], y


def get_data(i):
    temp = np.array([])
    while np.shape(temp)[0] != BILD_PRO_GENERATOR:
        temp = next(generators[i])[0]
    return temp


# generate a batch of images, returns images and targets
def generate_fake_samples(g_model, samples, patch_shape):
    # generate fake instance
    X = g_model.predict(samples)
    # create 'fake' class labels (0)
    y = np.zeros((len(X), patch_shape, patch_shape, 1))
    return X, y


# generate samples and save as a plot and save the model
def summarize_performance(step, g_model, n_samples=8):
    # select a sample of input images
    X_realA = next(Utils.get_generator(batch_size=n_samples))
    # generate a batch of fake samples
    X_fakeB, _ = generate_fake_samples(g_model, X_realA, 1)

    # plot real source images
    for i in range(n_samples):
        plt.subplot(5, n_samples, 1 + i)
        plt.axis('off')
        plt.imshow(X_realA[i])
    # plot generated target image
    for (i, data) in enumerate(X_fakeB):
        plt.subplot(5, n_samples, 1 + n_samples + i)
        plt.axis('off')
        plt.imshow(data)

    # save plot to file
    filename1 = 'generate/data/plot_%06d.png' % (step + 1)
    plt.savefig(filename1)
    plt.close()
    # save the generator model
    filename2 = 'generate/model/model_%06d.h5' % (step + 1)
    g_model.save(filename2)
    print('>Saved: %s and %s' % (filename1, filename2))


# train pix2pix models
def train(d_model, g_model, gan_model, n_epochs=10):
    # determine the output square shape of the discriminator
    n_patch = d_model.output_shape[1]
    # unpack dataset
    # calculate the number of batches per training epoch
    # bat_per_epo = int(len(trainA) / n_batch)
    bat_per_epo = 80
    # calculate the number of training iterations
    n_steps = bat_per_epo * n_epochs
    # manually enumerate epochs
    for i in range(n_steps):
        # select a batch of real samples
        [X_realA, X_realB, X_realC], y_real = generate_real_samples(n_patch)
        # generate a batch of fake samples
        X_fakeB, y_fake = generate_fake_samples(g_model, X_realA, n_patch)
        # print(X_realA.shape, X_realB.shape, y_real.shape, X_fakeB.shape, y_fake.shape)

        # update discriminator for real samples
        d_loss1 = d_model.train_on_batch([X_realC, X_realB], y_real)
        # update discriminator for generated samples
        d_loss2 = d_model.train_on_batch([X_realC, X_fakeB], y_fake)
        # update the generator
        g_loss, _, _ = gan_model.train_on_batch([X_realA, X_realC], [y_real, X_realB])
        # summarize performance
        print('>%d, d_real: %.3f  d_fake: %.3f  gan: %.3f' % (i + 1, d_loss1, d_loss2, g_loss))
        # summarize model performance
        if (i + 1) % (bat_per_epo * 20) == 0:
            summarize_performance(i, g_model)


# image_shape = dataset[0].shape[1:]
# define the models
image_shape_g = (512, 512, 1)
image_shape_d = (512, 512, 4)
d_model = define_discriminator(image_shape_d)
g_model = define_generator(image_shape_g)
# # define the composite model
gan_model = define_gan(g_model, d_model, image_shape_g, image_shape_d)
# gan_model.summary()
# # train model
# train(d_model, g_model, gan_model)

g_model.summary()
