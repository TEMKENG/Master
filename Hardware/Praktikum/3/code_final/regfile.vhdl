library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;


entity REGFILE is
  port (
    clk: in std_logic;
    out0_data: out std_logic_vector (15 downto 0);  -- Datenausgang 0
    out0_sel: in std_logic_vector (2 downto 0);     -- Register-Nr. 0
    out1_data: out std_logic_vector (15 downto 0);  -- Datenausgang 1
    out1_sel: in std_logic_vector (2 downto 0);     -- Register-Nr. 1
    in_data: in std_logic_vector (15 downto 0);     -- Dateneingang
    in_sel: in std_logic_vector (2 downto 0);       -- Register-Wahl
    load_lo, load_hi: in std_logic                  -- Register laden
  );
end REGFILE;


architecture RTL of REGFILE is
  signal reg_idx: std_logic_vector(15 downto 0);
  type t_regfile is array (0 to 7) of std_logic_vector(15 downto 0);
  signal reg: t_regfile;

begin

  -- Ausgabe --
  out0_data <= reg(to_integer(unsigned(out0_sel)));
  out1_data <= reg(to_integer(unsigned(out1_sel)));

  -- Ladevorgang --
  reg_idx <= reg(to_integer(unsigned (in_sel)));
  process (clk)
  begin
    if rising_edge(clk) then
      if (load_hi = '1') AND (load_lo = '1') then
        reg(to_integer(unsigned (in_sel))) <= in_data;
      elsif (load_hi = '1') then
        reg(to_integer(unsigned (in_sel))) <= in_data(15 downto 8) & reg_idx(7 downto 0);
      elsif (load_lo = '1') then
        reg(to_integer(unsigned (in_sel))) <= reg_idx(15 downto 8) & in_data(7 downto 0);
      end if;
    end if;
  end process;

end RTL;
