library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;


entity ALU is  port (   
   a   : in std_logic_vector (15 downto 0);  -- Eingang A   
   b   : in std_logic_vector (15 downto 0);  -- Eingang B    
   sel : in std_logic_vector (2 downto 0);   -- Operation    
   y   : out std_logic_vector (15 downto 0); -- Ausgang    
   zero: out std_logic    -- gesetzt, falls Eingang B = 0  
   ); 
   end ALU;
   
architecture BEHAVIOR of ALU is

begin
	process(a,b,sel)
	begin
		case(sel) is
			when "000" =>  y <= std_logic_vector(unsigned (a) + unsigned (b)) ; -- Addition

			when "001" =>  y <= std_logic_vector(unsigned (a) - unsigned (b)) ; -- Subtraction

			when "010" =>  y <= a(14 downto 0) & '0'; -- shift nach left

			when "011" =>  y <= a(15) & a(15 downto 1);-- shift nach rechts

			when "100" =>  y <= a and b; -- Logical and 

			when "101" =>  y <= a or b; -- Logical or

			when "110" => y <= a xor b; --logical xor

			when "111" =>  y <= not a; -- Logical not gate

			when others => y <= (others => '-') ;
		end case;
	end process;
    
	zero <= '1' when  b = X"0000" else '0'; --zero flag

end BEHAVIOR;
