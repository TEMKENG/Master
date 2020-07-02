import os
import sys
import copy
from PyQt5 import uic
import PyQt5.QtGui as qtg
import PyQt5.QtCore as qtc
import PyQt5.QtWidgets as qtw
from collections import defaultdict


class AlignDelegate(qtw.QStyledItemDelegate):
    def initStyleOption(self, option, index):
        super(AlignDelegate, self).initStyleOption(option, index)
        option.displayAlignment = qtc.Qt.AlignCenter


class GUI(qtw.QMainWindow):
    def __init__(self):
        super(GUI, self).__init__()
        uic.loadUi(os.path.join("MESI1.ui"), self)
        self.dico_cache1 = defaultdict(list)
        self.dico_cache2 = defaultdict(list)
        self.dico_event = defaultdict(list)

        self.dico_cache1 = dict()
        self.dico_cache2 = dict()
        self.dico_event = dict()

        self.wert.setText("18")
        self.ereignis_list.addItems(["Read", "Write"])
        self.prozessor_list.addItems(["1", "2"])

        # text center
        delegate = AlignDelegate(self.cache1)
        self.cache1.setItemDelegateForColumn(1, delegate)
        self.cache1.setItemDelegateForColumn(2, delegate)

        delegate = AlignDelegate(self.cache2)
        self.cache2.setItemDelegateForColumn(1, delegate)
        self.cache2.setItemDelegateForColumn(2, delegate)

        delegate = AlignDelegate(self.eventTab)
        self.eventTab.setItemDelegateForColumn(1, delegate)
        self.eventTab.setItemDelegateForColumn(2, delegate)
        # Button submit
        self.submit.clicked.connect(self.eventUpdate)

        self.show()

    def eventUpdate(self):
        print("Event")
        text = self.wert.text()
        prozessor = self.prozessor_list.currentText()
        ereignis = self.ereignis_list.currentText()
        time = len(self.dico_event)
        # self.dico_event[time].append([time, prozessor, ereignis])
        self.dico_event[time]=[str(time), prozessor, ereignis]
        self.eventTab = self.fullTable(self.eventTab, self.dico_event)
        # print(text, prozessor, ereignis, time)

    # def fullTable(self, table, elements):
    def fullTable(self, table, datas):
        print(datas)
        table.setRowCount(0)
        for key in datas:
            row_data = datas[key]
            # print(row_data)
            y = table.rowCount()
            table.insertRow(y)
            for i, data in enumerate(row_data):
                # print(data)
                item = qtw.QTableWidgetItem(data)
                item.setToolTip(str(data))
                table.setItem(y, i, item)
        header = table.horizontalHeader()
        # header.setSectionResizeMode(0, qtw.QHeaderView.Stretch)
        header.setSectionResizeMode(0, qtw.QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, qtw.QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, qtw.QHeaderView.ResizeToContents)

        return table


if __name__ == "__main__":
    app = qtw.QApplication([])
    gui = GUI()
    app.exec_()
