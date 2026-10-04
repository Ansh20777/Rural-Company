import numpy as np


rows = int(input("Number of rows: "))
matrix = []
for i in range(rows):
    row = input(f"Enter row {i+1} (space-separated): ").split()
    matrix.append([int(x) for x in row])

arr2d = np.array(matrix)
print(arr2d)
print(arr2d.shape)
