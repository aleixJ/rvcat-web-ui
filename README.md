## Local Setup

1. **Clone the repository**

2. **Install dependencies**

   - **Python**

     - **Without env**

       ```bash
       # Ensure pip is up to date
       pip install --upgrade pip

       # Install dependencies from requirements.txt
       pip install -r requirements.txt
       ```

     - **With env**

       ```bash
       # Create a virtual environment named rvcat
       python -m venv rvcat

       # Activate the environment (Windows)
       rvcat\Scripts\activate

       # For Mac/Linux
       # source rvcat/bin/activate

       # Install dependencies
       pip install --upgrade pip
       pip install -r requirements.txt
       ```

   - **Anaconda**

     - **Without env**

       ```bash
       # Make sure conda is updated
       conda update -n base -c defaults conda

       # Install dependencies directly (not recommended if you need an isolated env)
       pip install --upgrade pip
       pip install -r requirements.txt
       ```

     - **With env**

       ```bash
       conda create -n rvcat python=3.11.9
       conda activate rvcat

       # Install dependencies
       pip install --upgrade pip
       pip install -r requirements.txt
       ```

3. **Make the module rvcat** (if modified)

   ```bash
   python setup.py bdist_wheel --dist-dir .
   ```

4. **Run**
   ```bash
   python -m http.server 8000
   ```
   Go to "http://localhost:8000/index.html"
