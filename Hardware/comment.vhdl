clear && ghdl -a alu.vhdl pc.vhdl ir.vhdl controller.vhdl viscy_cpu.vhdl test_all.vhdl
clear && ghdl -r test_all behavior --wave=test.ghw
clear && gtkwave test.ghw test.save

cls && ghdl -a alu.vhdl pc.vhdl ir.vhdl controller.vhdl viscy_cpu.vhdl test_all.vhdl
cls && ghdl -r test_all behavior --wave=test.ghw
cls && ghdl -r viscy_cpu_tb behavior --wave=test.ghw
cls && gtkwave test.ghw test.save

vasy -a -p controller controller_vasy && boom controller_vasy controller_boom && proof controller_boom controller_vasy && boog controller_boom controller_boog && loon -x 1 controller_boog controller_final
