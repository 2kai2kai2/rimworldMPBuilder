# Reads requested graphics from a directory
# Use https://www.dropbox.com/sh/mz6zjq3f1d654f3/AAAQq0_J_RtsOYlP0XSgxzqha/Game%20art%20source
# And un-zip everything
from pathlib import Path
from typing import List, Dict, Tuple
from PIL import Image
import math

def loadGraphics(directory: str, tileSize: Tuple[int, int], fileStrs: List[str], saveFile: str):
    """
    Assumes file format is png
    fileStrs: a list in the format e.g. "UI/Icons/Genes/Gene_Something"
    """
    files: Dict[str, Path] = {}
    for f in fileStrs:
        p = next(Path(directory).resolve().rglob(f"*/{f}.[pP][nN][gG]"), None)
        if p is not None:
            files[f] = p

    def approxFactor(num: int) -> Tuple[int, int]:
        """Returns two values that are (badly) minimized but when multiplied together are greater than num"""
        # Start at about sqrt
        sqrt = math.sqrt(num)
        if math.ceil(sqrt) * math.floor(sqrt) >= num:
            return (math.ceil(sqrt), math.floor(sqrt))
        else:
            return (math.ceil(sqrt), math.ceil(sqrt))

    graphicsData: Dict[str, dict] = {}

    numImgs = len(files)
    # Calculate the total size we'll need
    tileDimensions = approxFactor(numImgs)
    totalDimensions = (tileDimensions[0] * tileSize[0], tileDimensions[1] * tileSize[1])
    img = Image.new("RGBA", totalDimensions, (0, 0, 0, 0))
    tileNum = 0
    for s in files:
        tile = Image.open(files[s])
        assert tile.width == tileSize[0]
        assert tile.height == tileSize[1]
        newX = (tileNum % tileDimensions[0]) * tileSize[0]
        newY = int(tileNum / tileDimensions[0]) * tileSize[1]
        img.paste(tile, (newX, newY))
        graphicsData[s] = {"x": newX, "y": newY}
        tileNum += 1
    img.save(Path(f"./page/{saveFile}").resolve())
    return graphicsData