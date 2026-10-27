# Food Corner – Online Food Ordering System

A lightweight, full-stack web application designed for a college MCA Web Technology assignment. The application demonstrates core CRUD operations for food items, customer order management, RESTful API design using Node.js and Express.js, responsive frontend styling with vanilla HTML/CSS/JavaScript, and automated CI/CD deployment to AWS Elastic Beanstalk via GitHub Actions and AWS OpenID Connect (OIDC).

---

## 1. Project Architecture & Folder Structure

```text
food-ordering-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD deployment workflow to AWS Elastic Beanstalk
├── public/
│   ├── index.html              # Frontend user interface (Menu, Order Form, Orders Table, Menu Management)
│   ├── style.css               # Warm orange & white responsive styling (No CSS frameworks)
│   └── script.js               # Client-side JavaScript (Fetch API, DOM manipulation, form validation)
├── app.js                      # Express backend server with REST endpoints & JSON persistence
├── menu.json                   # JSON demonstration data for food menu items
├── orders.json                 # JSON demonstration data for customer orders
├── package.json                # Project dependencies, scripts, and metadata
├── .gitignore                  # Git ignore rules (node_modules, logs, zip packages)
└── README.md                   # Complete documentation and deployment guide
```

---

## 2. Technology Stack

- **Backend:** Node.js & Express.js (REST API, JSON file persistence, static file serving)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+ `async`/`await`, `fetch` API)
- **Data Storage:** JSON files (`menu.json`, `orders.json`) for straightforward demonstration without database setup overhead
- **Version Control:** Git & GitHub
- **CI/CD:** GitHub Actions with OpenID Connect (OIDC) authentication
- **Cloud Hosting:** AWS Elastic Beanstalk (Node.js runtime environment on AWS EC2)

---

## 3. Core Features

### A. Food Menu CRUD Operations
1. **View Dishes:** Neatly organized cards showing dish name, category, and price in Indian Rupees (₹).
2. **Category Filter:** Filter by *All*, *Fast Food*, *South Indian*, *Main Course*, or *Snacks*.
3. **Add New Dish:** Form with field validation (non-empty name, selected category, positive price).
4. **Edit Dish:** Populate the form, modify details, and update the item via `PUT /api/menu/:id`.
5. **Delete Dish:** Delete item with browser confirmation via `DELETE /api/menu/:id`.
6. **Automatic Refresh:** The interface instantly reloads data after every successful operation.

### B. Customer Order Management
1. **Order Form:** Customer name input, dynamic food item selector, quantity selector (min 1).
2. **Live Calculation:** Dynamically calculates `Unit Price × Quantity = Total Amount`.
3. **Quick Select:** Clicking "Order Now" on any dish card automatically selects that dish in the form.
4. **Order Status Tracking:** Orders are tracked across four states: `Pending`, `Preparing`, `Delivered`, and `Cancelled`.
5. **Inline Status Updates:** Modify status directly from the dropdown in the orders table.
6. **Order Deletion:** Remove orders with confirmation via `DELETE /api/orders/:id`.
7. **Live Summary Badges:** Displays real-time counts for Total, Pending, Preparing, Delivered, and Cancelled orders.

---

## 4. REST API Reference

| Resource | HTTP Method | Endpoint | Description | Request Body | Success Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Server health check (used by AWS ALB) | None | `200 OK` |
| **Menu** | `GET` | `/api/menu` | List all menu dishes | None | `200 OK` |
| **Menu** | `GET` | `/api/menu/:id` | Get dish details by ID | None | `200 OK` |
| **Menu** | `POST` | `/api/menu` | Add a new food item | `{ "name": "...", "category": "...", "price": 120 }` | `201 Created` |
| **Menu** | `PUT` | `/api/menu/:id` | Update an existing food item | `{ "name": "...", "category": "...", "price": 140 }` | `200 OK` |
| **Menu** | `DELETE`| `/api/menu/:id` | Delete a food item | None | `200 OK` |
| **Orders** | `GET` | `/api/orders` | List all customer orders | None | `200 OK` |
| **Orders** | `POST` | `/api/orders` | Place a new customer order | `{ "customerName": "...", "dishId": 1, "quantity": 2 }` | `201 Created` |
| **Orders** | `PATCH`| `/api/orders/:id/status`| Update order status | `{ "status": "Preparing" }` | `200 OK` |
| **Orders** | `DELETE`| `/api/orders/:id` | Delete an order | None | `200 OK` |

---

## 5. Local Execution and Testing Guide

Follow these steps in your terminal or command prompt:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm start
```
The server will start listening on `http://localhost:8080` (or `http://0.0.0.0:8080`).

### Step 3: Open in Browser
Open your browser and navigate to:
```text
http://localhost:8080
```

### Step 4: Testing the APIs from the Terminal

**Test Health Endpoint:**
```bash
curl http://localhost:8080/health
```

**Fetch Menu Items:**
```bash
curl http://localhost:8080/api/menu
```

**Add a New Dish:**
```bash
curl -X POST http://localhost:8080/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Cold Coffee","category":"Beverages","price":60}'
```

**Place an Order:**
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Ananya Verma","dishId":1,"quantity":2}'
```

**Update Order Status:**
```bash
curl -X PATCH http://localhost:8080/api/orders/ORD-1001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Delivered"}'
```

---

## 6. GitHub Integration Guide

### How Editing, Pushing, and Deploying Differ
In software engineering, these are three distinct lifecycle stages:

1. **Local Editing & Testing (Development):**
   - You write or modify code in your local editor (e.g., VS Code).
   - You run `npm start` and test functionality locally.
   - *Impact:* Changes exist **only on your local computer**. Nothing is saved to GitHub or running on AWS.

2. **Commit & Push to GitHub (Version Control):**
   - You stage your changes (`git add .`), create a commit snapshot (`git commit -m "..."`), and push to your remote repository (`git push origin main`).
   - *Impact:* Your code is safely backed up on GitHub and versioned. If automated CI/CD is enabled, GitHub Actions detects the push event.

3. **Deploying to AWS Elastic Beanstalk (Hosting / Production):**
   - GitHub Actions executes the workflow in `.github/workflows/deploy.yml`.
   - It packages the application code into a `.zip` file, authenticates with AWS using OIDC, uploads the bundle to Amazon S3, and instructs Elastic Beanstalk to run the new version on the live EC2 web server.
   - *Impact:* The live public website is updated for users across the internet.

### Git Terminal Commands

Initialize repository and commit files:
```bash
# 1. Initialize local Git repository (if not already initialized)
git init

# 2. Check changed files
git status

# 3. Stage all project files (node_modules is excluded by .gitignore)
git add .

# 4. Commit the initial release
git commit -m "Initial commit: Food Corner web application"

# 5. Set the default branch to main
git branch -M main

# 6. Link to your GitHub repository
# Replace <YOUR_GITHUB_USERNAME> and <YOUR_REPO_NAME> with your actual details
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 7. Push code to GitHub
git push -u origin main
```

---

## 7. AWS Elastic Beanstalk Deployment with GitHub Actions OIDC

To ensure college-grade cloud security, **no permanent AWS access keys (Access Key ID and Secret Access Key)** are stored in GitHub Secrets. Instead, we use **GitHub Actions OpenID Connect (OIDC)**, which requests short-lived, temporary AWS STS credentials during the workflow run.

### Step 1: Configure AWS IAM Identity Provider (OIDC)
1. Open the **AWS Management Console** and navigate to **IAM > Identity Providers**.
2. Click **Add provider**.
3. Select **OpenID Connect**.
4. Set **Provider URL**: `https://token.actions.githubusercontent.com`
5. Set **Audience**: `sts.amazonaws.com`
6. Click **Add provider**.

### Step 2: Create IAM Role for GitHub Actions
1. In IAM, go to **Roles > Create role**.
2. Select **Web identity**.
3. Choose Identity provider: `token.actions.githubusercontent.com` and Audience: `sts.amazonaws.com`.
4. Enter your GitHub repository details:
   - Organization/User: `<YOUR_GITHUB_USERNAME>`
   - Repository: `<YOUR_REPO_NAME>`
   - Branch: `main`
5. Create a Trust Policy. It should look like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### Step 3: Attach Permissions to the IAM Role
Attach a customer managed policy allowing deployment to Elastic Beanstalk and S3 storage:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ElasticBeanstalkDeploy",
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:CreateApplicationVersion",
        "elasticbeanstalk:DescribeApplicationVersions",
        "elasticbeanstalk:DescribeEnvironments",
        "elasticbeanstalk:UpdateEnvironment"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3SourceBundleUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::<YOUR_EB_S3_BUCKET>",
        "arn:aws:s3:::<YOUR_EB_S3_BUCKET>/*"
      ]
    }
  ]
}
```

### Step 4: Configure GitHub Repository Secrets & Variables

In your GitHub repository, go to **Settings > Secrets and variables > Actions**:

#### Secret (Under "Repository secrets"):
- `AWS_ROLE_TO_ASSUME`: The ARN of the IAM role created above (e.g., `arn:aws:iam::<AWS_ACCOUNT_ID>:role/github-actions-eb-role`).

#### Variables (Under "Repository variables"):
- `AWS_REGION`: AWS region where your Elastic Beanstalk is hosted (e.g., `us-east-1` or `ap-south-1`).
- `EB_APP_NAME`: Name of your Elastic Beanstalk Application (e.g., `food-corner-app`).
- `EB_ENV_NAME`: Name of your Elastic Beanstalk Environment (e.g., `food-corner-env`).
- `EB_S3_BUCKET`: The S3 bucket generated by Elastic Beanstalk in your account (e.g., `elasticbeanstalk-ap-south-1-<AWS_ACCOUNT_ID>`).

### Step 5: Triggering Automated Deployment
Whenever you push changes to the `main` branch:
```bash
git add .
git commit -m "Update dish menu prices"
git push origin main
```
1. GitHub Actions automatically starts the `Deploy Food Corner to AWS Elastic Beanstalk` workflow.
2. It assumes the IAM role via OIDC.
3. It bundles the app code and uploads it to S3.
4. Elastic Beanstalk applies the new version to the EC2 instances with zero manual file uploads.
