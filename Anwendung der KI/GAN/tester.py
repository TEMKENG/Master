import os
import shutil
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from tensorflow.keras.datasets.mnist import load_data

(trainX, _), (_, _) = load_data()


def crop(path="data/Smiley_Grinsen/Smiley_Grinsen ÔÇô 31.png"):
    orig = img = Image.open(path).convert('L')
    img = np.array(img)
    # plt.imshow(img, cmap="gray")
    # plt.figure()
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

    # imgs = Image.fromarray(img, "L")
    # imgs = Image.fromarray(img)
    # imgs.save(path.replace("data"   , "crop"))
    # imgs = np.array(imgs)
    # plt.imshow(imgs)
    # plt.figure()
    # img = Image.fromarray(img, mode="L")
    # plt.imshow(img, cmap="gray")
    # plt.show()
    return img, orig


if __name__ == '__main__':
    # path = "data/Smiley_Grinsen/Smiley_Grinsen.png"
    shutil.rmtree("crop", ignore_errors=True)
    os.makedirs("crop", exist_ok=True)
    directory = 'Bilder_Smileys'
    files = [os.path.join(directory, file) for file in os.listdir(directory)]
    # for file in directories:
    #     os.makedirs(file.replace("data", "crop"), exist_ok=True)
    #
    # files = {}
    # for directory in directories:
    #     files[directory] = [os.path.join(directory, file) for file in os.listdir(directory)]
    img, original = crop()

    imArr = {}

    with Image.open("Bilder_Smileys/Smiley_Grinsen ÔÇô 31.png") as im:

        reg = imArr[0] = im
        # im.show()
        out_im = reg.resize((28, 28))
        imArr[1] = out_im
        # out_im.show()

        box = (120, 120, 325, 325)
        reg = im.crop(box)
        imArr[2] = reg

        out_crop = reg.resize((28, 28))
        imArr[3] = out_crop
        for key in imArr:
            plt.subplot(2, 4, key + 1)
            plt.imshow(imArr[key], cmap="gray")
        # out_crop.show()
    # col = 8
    # row = 4
    # imgs, labels = next(generator_for_all)
    # for i in range(row):
    #     for j in range(col):
    #         plt.subplot(row, col, i * col + j + 1)
    #         plt.axis("off")
    #         plt.imshow(imgs[i * col + j][:, :, 0])
    plt.subplot(2, 4, key + 2)
    imge = Image.fromarray(img, 'L')
    imge = imge.resize((28, 28))
    imge = np.array(imge)
    plt.imshow(original, cmap="gray")
    plt.title("Original")
    plt.subplot(2, 4, key + 3)
    plt.imshow(img, cmap="gray")
    plt.title("Crop")
    plt.subplot(2, 4, key + 4)
    plt.imshow(imge, cmap="gray")
    plt.title("Crop:28x28")
    plt.subplot(2, 4, key + 5)
    plt.title("Mnist:28x28")
    plt.imshow(trainX[0], cmap="gray")
    plt.show()
    data = []
    for i, file in enumerate(files):
        img, _ = crop(file)
        # plt.figure(figsize=img.shape)
        plt.figure()

        plt.imshow(img, cmap="gray", interpolation="None")
        plt.savefig(file.replace(directory, "crop"))
        plt.close()
        # img = Image.fromarray(img, 'L')
        # img = img.resize((28, 28))
        # img = np.array(img)
        data.append(img)
    data = np.array(data)
