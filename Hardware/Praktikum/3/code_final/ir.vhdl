library IEEE;
use IEEE.std_logic_1164.all;

entity IR is  port (    
	clk: in std_logic;    
	load: in  std_logic;                        -- Steuersignal    
	ir_in: in std_logic_vector (15 downto 0);   -- Dateneingang    
	ir_out: out std_logic_vector (15 downto 0)  -- Datenausgang  
);end IR;

architecture BEHAVIOR_IR of IR is
	signal temporal_ir : std_logic_vector(15 downto 0) := "0000000000000000";
begin
	process(clk)
	
	begin
		if rising_edge(clk) then
			if load = '1' then
				temporal_ir <= ir_in;
			end if;
		end if;
	end process;
	ir_out <= temporal_ir;
end BEHAVIOR_IR;
