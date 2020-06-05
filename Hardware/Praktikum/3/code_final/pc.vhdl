library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity PC is
	port (
		clk: in std_logic;
		reset, inc, load: in std_logic;
		pc_in: in std_logic_vector (15 downto 0);
		pc_out: out std_logic_vector (15 downto 0)
	);
end PC;


architecture BEHAVIOR of PC is
	signal counter: unsigned (15 downto 0);
begin
	process (clk)
	begin
		if rising_edge(clk) then
			if(reset = '1') then
				counter <= "0000000000000000";
			else
				if(load = '1') then
					counter <= unsigned(pc_in);
				end if;
				if(inc = '1') then
					counter <= counter + 1;
				end if;
			end if;	
			
			pc_out <= std_logic_vector(counter);
		end if;	
	end process;
	
	
end BEHAVIOR;
