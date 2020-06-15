import os
import shutil as sh
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


if __name__ == '__main__':
    print(os.path.exists('Smiley_Herz'))
    generator = get_generator()
    x, y = next(generator)
    print(x.shape, y.shape)
