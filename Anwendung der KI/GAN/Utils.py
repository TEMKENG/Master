import os
import numpy as np
import shutil as sh
from PIL import Image
from datetime import datetime

from tensorflow.python.keras.preprocessing.image import ImageDataGenerator


# Die Funktion erzeugt mehrere Generator
def get_generators(classes=None, batch_size=4, image_size=(512, 512)):
    if classes is None:
        classes = ['Smiley_Grinsen', 'Smiley_Herz', 'Smiley_Lachen']
    generators = list()
    for directory in classes:
        # Jeder Generator sollte 'batch_size' Bilder generieren
        generators.append(get_generator(directory, batch_size=batch_size, image_size=image_size))
    return generators


def get_generator(directory: str = 'data', image_size=(512, 512), batch_size=32, color_mode="grayscale"):
    datagen = ImageDataGenerator(rescale=1 / 255)
    generator = datagen.flow_from_directory(directory, color_mode=color_mode, class_mode='sparse',
                                            batch_size=batch_size, target_size=image_size)
    return generator


def split_dataset(path_to_dataset: str = 'Bilder_Smileys', classes=None):
    if classes is None:
        classes = ['Smiley_Grinsen', 'Smiley_Herz', 'Smiley_Lachen']
    for classe in classes:
        os.makedirs(os.path.join('data', classe), exist_ok=True)
        os.makedirs(os.path.join(classe, 'data'), exist_ok=True)
    data_name = [os.path.join(path_to_dataset, i) for i in os.listdir(path_to_dataset)]

    for filename in data_name:
        for classe in classes:
            if classe in filename:
                sh.copy(filename, os.path.join('data', classe, os.path.basename(filename)))
                sh.copy(filename, os.path.join(classe, 'data', os.path.basename(filename)))


def crops(directory='Bilder_Smileys'):
    def crop(path="data/Smiley_Grinsen/Smiley_Grinsen ÔÇô 31.png"):
        img = Image.open(path).convert('L')
        img = np.array(img)

        for i, row in enumerate(img):
            if row.sum() / len(row) != 255:
                if i - 10 > 0:
                    img = img[i - 10:]
                break
        img = img[::-1]
        for i, row in enumerate(img):
            if row.sum() / len(row) != 255:
                if i - 10 > 0:
                    img = img[i - 10:]
                break
        for i in range(img.shape[1]):
            col = img[:, i]
            if col.sum() / len(col) != 255:
                if i - 10 > 0:
                    img = img[:, i - 10:]
                break
        for i in reversed(range(img.shape[1])):
            col = img[:, i]
            if col.sum() / len(col) != 255:
                if i - 10 > 0:
                    img = img[:, :i + 10][::-1]
                break
        for i in range(img.shape[0]):
            for j in range(img.shape[1]):
                if img[i][j] == 255:
                    img[i][j] = 0
                else:
                    img[i][j] = 1

        img = Image.fromarray(img, 'L')
        img = img.resize((28, 28))
        img = np.array(img)
        return img

    if os.path.exists("data.npy"):
        print("schon vorhanden!!!")
        with open("data.npy", "rb") as f:
            data = np.load(f)
            return data
    else:
        files = [os.path.join(directory, file) for file in os.listdir(directory)]
        data = list()
        start = datetime.now()
        for file in files:
            data.append(crop(file))
        data = np.array(data)
        data = data[:, :, :, np.newaxis]
        np.save("data.npy", data)
        print((datetime.now() - start))
        return data


if __name__ == '__main__':
    data = crops()
