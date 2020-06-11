
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity CONTROLLER is  
	port (   clk, reset: in std_logic;    
			ir: in std_logic_vector(15 downto 0);  -- Befehlswort    
			ready, zero: in std_logic;         -- weitere Statussignale    
			c_reg_ldmem, c_reg_ldi,            -- Auswahl beim Register-Laden    
			c_regfile_load_lo, c_regfile_load_hi,  -- Steuersignale Reg.-File    
			c_pc_load, c_pc_inc,               -- Steuereingaenge PC    
			c_ir_load,                         -- Steuereingang IR    
			c_mem_rd, c_mem_wr,                -- Signale zum Speicher
			c_adr_pc_not_reg : out std_logic   -- Auswahl Adress-Quelle  
);end CONTROLLER;
	
architecture RTL of CONTROLLER is
	--Aufzaehlung fuer den Zustand 
	type t_state is (s_reset, s_if1, s_if2, s_id, s_alu, s_ldil, s_ldih, 
	s_halt, s_ld1, s_ld2, s_st1, s_st2, s_jmp);
	signal state, next_state : t_state;
begin
	--Zustandsregister
	process (clk)	--(nur) Taktsignal in Sensitivitaetsliste
	begin
		if rising_edge (clk) then
			if reset = '1' then 
				state <= s_reset;
			else 
				state <= next_state;
			end if;
		end if;
	end process;
	
	--prozess fuer die uebergangs- und Ausgabefunktion
	process (state, ready, zero, ir)
	begin
		--Dfault-werte fuer alle Ausgngssignale
		c_regfile_load_lo <= '0';
		c_regfile_load_hi <= '0';
		c_adr_pc_not_reg <= '0';
		c_mem_rd <= '0';
		c_mem_wr <= '0';
		c_ir_load <= '0';
		c_pc_load <= '0';
		c_pc_inc <= '0';
		c_reg_ldmem <= '0';
		c_reg_ldi <= '0';
		next_state <= state;
		
	--Zustandsabhaengige Belegung
		-- eingentliche Automaten-Logik
		case state is
			when s_reset =>
				next_state <= s_if1;
			when s_if1 =>
				if ready = '0' then
					 next_state <= s_if2; 
				end if;
			when s_if2 =>
				c_mem_rd <= '1';
				c_ir_load <= '1';
				c_adr_pc_not_reg <= '1';
				if ready = '1' then
					 next_state <= s_id; 
				end if;
				
			when s_id =>

				c_pc_inc <= '1';
				if (ir(15 downto 14) = "00") then
					next_state <= s_alu;
				elsif (ir(15 downto 14) = "01") then
					if   (ir(12 downto 11) = "00") then
						next_state <= s_ldil;
					elsif (ir(12 downto 11) = "01") then
						next_state <= s_ldih;
					elsif (ir(12 downto 11) = "10") then 
				
							next_state <= s_ld1;

					elsif (ir(12 downto 11) = "11") then 
						next_state <= s_st1;
					else
						next_state <= s_halt;
					end if;
				elsif (ir(15 downto 14) = "10") then
					if (ir(12 downto 11) = "00") then
						next_state <= s_jmp;
					elsif (ir(12 downto 11) = "10") then
						if(zero = '1') then
							next_state <= s_jmp;
						else	
							next_state <= s_if1;
						end if;
					elsif (ir(12 downto 11) = "11") then
						if(zero = '0') then
								next_state <= s_jmp;
						else	
								next_state <= s_if1;
						end if;
						
					else 
						next_state <= s_halt;
					end if;
				else
					next_state <= s_halt;
				end if;
				
			when s_alu =>
				next_state <= s_if1;
				c_regfile_load_hi <= '1';
				c_regfile_load_lo <= '1';
			when s_ldih =>
				c_reg_ldi <= '1';
				next_state <= s_if1;
				c_regfile_load_hi <= '1';
			when s_ldil =>
				c_reg_ldi <= '1';
				next_state <= s_if1;
				c_regfile_load_lo <= '1';
				
			when s_ld1 =>
				if ready = '0'  then
					next_state <= s_ld2;
				end if;
			when s_ld2 =>
				c_mem_rd <= '1';
				c_reg_ldmem <= '1';
				c_adr_pc_not_reg <= '0';
				c_regfile_load_hi <= '1';
				c_regfile_load_lo <= '1';
				if ready = '1' then
					next_state <= s_if1;
				end if;
				
			when s_st1 =>
				if ready = '0'  then
					next_state <= s_st2;
					end if;
			when s_st2 =>
				c_mem_wr <= '1';
				c_adr_pc_not_reg <= '0';
				if ready = '1' then
					next_state <= s_if1;
				end if;
			when s_jmp =>
				c_pc_load <= '1';
				next_state <= s_if1;
			when s_halt =>
				next_state <= s_halt;
			when others  =>
				next_state <= s_reset;
		end case;
	end process;
	
end RTL;
