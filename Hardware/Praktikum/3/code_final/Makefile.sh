cls && ghdl -a alu.vhdl pc.vhdl ir.vhdl controller.vhdl viscy_cpu.vhdl test_all.vhdl && ghdl -r viscy_cpu_tb behavior --wave=test.ghw && gtkwave test.ghw test.save
clear && ghdl -a alu.vhdl pc.vhdl ir.vhdl controller.vhdl viscy_cpu.vhdl test_all.vhdl && ghdl -r viscy_cpu_tb behavior --wave=test.ghw && gtkwave test.ghw test.save


vasy controller controller_vasy
