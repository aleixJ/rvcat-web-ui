from setuptools import setup, find_packages

setup(
    name="rvcat",
    version="0.1",
    packages=find_packages(include=["rvcat", "rvcat.*"]),
    include_package_data=True,  # Ensure non-Python files are included
    package_data={
        "rvcat": [
            "processors/*.cfg",  # Include all .cfg files in the processors directory
            "isas/*.csv",  # Include all .csv files in the isas directory
            "examples/*.s",  # Include all .s files in the examples directory
        ],
    },
    install_requires=[
        "cmd2",
        "numpy",
    ],
    entry_points={
        "console_scripts": [
            "rvcat=rvcat.rvcat:main",
        ],
    },
)
