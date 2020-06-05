library ieee;
use ieee.numeric_std.all;
use ieee.std_logic_1164.ALL;

entity VISCY_CPU is
  port ( 
    clk:     in  std_logic;
    reset:   in  std_logic;
    ready:   in  std_logic;
    rdata:   in  std_logic_vector (15 downto 0);
    rd   :   out std_logic;
    wr:      out std_logic;
    adr:     out std_logic_vector (15 downto 0);
    wdata:   out std_logic_vector (15 downto 0)
  );
end VISCY_CPU;

architecture STRUCTURE of VISCY_CPU is
	--  ALU component
	component ALU is
		port(
			a   : in std_logic_vector (15 downto 0);  -- Eingang A    
			b   : in std_logic_vector (15 downto 0);  -- Eingang B    
			sel : in std_logic_vector (2 downto 0);   -- Operation    
			y   : out std_logic_vector (15 downto 0); -- Ausgang   
			zero: out std_logic    -- gesetzt, falls Eingang B = 0 
		);
    end component;
    -- REGFILE component
    component REGFILE is
		port(
			clk: in std_logic;
			load_lo, load_hi: in std_logic;                  -- Register laden
			out0_sel: in std_logic_vector (2 downto 0);     -- Register-Nr. 0
			out1_sel: in std_logic_vector (2 downto 0);     -- Register-Nr. 1
			in_data: in std_logic_vector (15 downto 0);     -- Dateneingang
			in_sel: in std_logic_vector (2 downto 0);       -- Register-Wahl
			out0_data: out std_logic_vector (15 downto 0);  -- Datenausgang 0
			out1_data: out std_logic_vector (15 downto 0)  -- Datenausgang 1
		);
	end component;
	--~ IR component
	component IR is
		port (
			clk: in std_logic;
			load: in  std_logic;                        -- Steuersignal
			ir_in: in std_logic_vector (15 downto 0);   -- Dateneingang
			ir_out: out std_logic_vector (15 downto 0)  -- Datenausgang
		 );
	end component;
	-- PC component
	component PC is
		port (
			clk: in std_logic;
			reset: in  std_logic;            -- Steuersignale
			inc: in  std_logic;            	-- Steuersignale
			load: in  std_logic;            -- Steuersignale
			pc_in: in std_logic_vector (15 downto 0);   -- Dateneingang
			pc_out: out std_logic_vector (15 downto 0)  -- Ausgabe Zählerstand
		);
	end component;
	-- CONTROLLER component
	component CONTROLLER is  
	port (   clk, reset: in std_logic;    
			ir: in std_logic_vector(15 downto 0);  -- Befehlswort    
			ready, zero: in std_logic;         -- weitere Statussignale    
			c_reg_ldmem, c_reg_ldi,            -- Auswahl beim Register-Laden    
			c_regfile_load_lo, c_regfile_load_hi,  -- Steuersignale Reg.-File    
			c_pc_load, c_pc_inc,               -- Steuereingänge PC    
			c_ir_load,                         -- Steuereingang IR    
			c_mem_rd, c_mem_wr,                -- Signale zum Speicher
			c_adr_pc_not_reg : out std_logic   -- Auswahl Adress-Quelle  
		);
	end component;

	-- interne signal
		--ALU output signal
	signal alu_y   :  std_logic_vector (15 downto 0); 			-- Ausgang   
	signal alu_zero:  std_logic; 								-- gesetzt, falls Eingang B = 0 

		--IR output signal
	signal ir_out:  std_logic_vector (15 downto 0); 			-- Ausgabe Zählerstand
		--REGFILE in und output signal
	signal reg_in_data :  	std_logic_vector (15 downto 0);  
	signal reg_out0_data :  std_logic_vector (15 downto 0);  
	signal reg_out1_data :  std_logic_vector (15 downto 0);  
		-- PC output signal
	signal pc_out:  std_logic_vector (15 downto 0);
	-- CONTROLLER output signal
	signal c_adr_pc_not_reg, c_pc_inc, c_pc_load, c_ir_load, c_id_low, c_id_high, c_reg_ldi, c_reg_ldmem, c_mem_rd, c_mem_wr: std_logic;

	-- configuration --
	for VISCY_PC: PC use entity WORK.PC(BEHAVIOR);
	for VISCY_ALU: ALU use entity WORK.ALU(BEHAVIOR);
	for VISCY_IR: IR use entity WORK.IR(BEHAVIOR_IR);
	for VISCY_REG: REGFILE use entity WORK.REGFILE(RTL);
	for VISCY_CONTROLLER: CONTROLLER use entity WORK.CONTROLLER(RTL);
	
	begin
		wr <= c_mem_wr;
		rd <= c_mem_rd;
		wdata <= reg_out1_data;
		-- Instantiate ALU...
		VISCY_ALU: ALU port map (
			a	=>reg_out0_data,
			b	=>reg_out1_data,
			sel	=>ir_out(13 downto 11),
			y 	=>alu_y,
			zero=>alu_zero
		);
		-- Instantiate REGFILE...
		VISCY_REG: REGFILE port map (
			clk=> clk,
			load_lo=> c_id_low, 
			load_hi=> c_id_high,
			in_sel=> ir_out(10 downto 8),
			out0_sel=> ir_out(7 downto 5),
			out1_sel=> ir_out(4 downto 2),
			in_data=> reg_in_data,
			out0_data=> reg_out0_data,
			out1_data=>reg_out1_data 
		);
		-- Instantiate PC...
		VISCY_PC: PC port map (
			clk=> clk,
			reset=> reset,
			inc=> c_pc_inc,
			load=>c_pc_load,
			pc_out=> pc_out,
			pc_in=> reg_out0_data
		);
		-- Instantiate IR...
		VISCY_IR: IR port map (
			clk=>clk,
			ir_in=>rdata,
			ir_out=>ir_out,
			load=>c_ir_load
		);
		-- Instantiate CONTROLLER...
		VISCY_CONTROLLER: CONTROLLER port map(
					clk=> clk,
					ir=> ir_out,
					ready=> ready,
					reset=> reset,
					zero=> alu_zero,
					c_mem_rd=>c_mem_rd,
					c_mem_wr=> c_mem_wr,
					c_pc_inc=> c_pc_inc,
					c_adr_pc_not_reg=> c_adr_pc_not_reg,
					c_regfile_load_lo=> c_id_low,
					c_regfile_load_hi=>c_id_high,
					c_reg_ldi=>c_reg_ldi,
					c_ir_load=> c_ir_load,
					c_pc_load=> c_pc_load,
					c_reg_ldmem=> c_reg_ldmem
			);

		ADRESSBUS : process(pc_out, reg_out0_data, c_adr_pc_not_reg)
		begin
			if c_adr_pc_not_reg = '1' then
				adr <= pc_out;
			else
				adr <= reg_out0_data;
				
			end if ;
		end process ; -- ADRESSBUS

		DATENBUS : process(rdata, ir_out, alu_y, c_reg_ldmem, c_reg_ldi)
		begin
				-- reg_in_data <= alu_y;
				if c_reg_ldmem = '1' then
					reg_in_data <= rdata;
				elsif c_reg_ldi = '1' then
					reg_in_data <= ir_out(7 downto 0) & ir_out(7 downto 0);
				elsif  c_reg_ldi ='0' and c_reg_ldmem = '0' then
					reg_in_data <= alu_y;
					
				end if;
		end process ; -- DATENBUS

end STRUCTURE;
