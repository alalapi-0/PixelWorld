# 建造
BUILD tree at (10,5)
BUILD house using wood=5,stone=3 at (12,6)
BUILD road line from (2,2) to (2,8)

# 采集/搬运/补货
COLLECT wood 10 from (6,3) to STOCKPILE
HAUL seed 3 from STOCKPILE to (9,4)

# 复合命令（管道）
COLLECT stone 6 from (5,5) -> BUILD fence at (5,6)
