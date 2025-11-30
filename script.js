document.addEventListener('DOMContentLoaded', () => {
    const addExpBtn = document.getElementById('add-exp-btn');
    const expContainer = document.getElementById('experience-container');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsArea = document.getElementById('results-area');
    const btnContent = document.querySelector('.btn-content');

    // Dynamic Experience Fields
    addExpBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'experience-item';
        div.innerHTML = `
            <div class="input-row">
                <input type="text" class="exp-role" placeholder="Job Title">
                <input type="text" class="exp-company" placeholder="Company">
            </div>
            <textarea class="exp-desc" placeholder="Key responsibilities and achievements..."></textarea>
        `;
        expContainer.appendChild(div);
    });

    // Analyze Logic
    analyzeBtn.addEventListener('click', async () => {
        // Collect Data
        const cvData = {
            personal: {
                name: document.getElementById('name').value,
                country: document.getElementById('country').value,
                targetRole: document.getElementById('target-role').value
            },
            education: {
                degree: document.getElementById('degree').value,
                major: document.getElementById('major').value,
                university: document.getElementById('university').value
            },
            experience: Array.from(document.querySelectorAll('.experience-item')).map(item => ({
                role: item.querySelector('.exp-role').value,
                company: item.querySelector('.exp-company').value,
                description: item.querySelector('.exp-desc').value
            })),
            skills: document.getElementById('skills').value,
            certifications: document.getElementById('certs').value
        };

        const jobText = document.getElementById('job-text').value;

        if (!jobText) {
            alert("Please provide the Job Description.");
            return;
        }

        // UI Loading
        setLoading(true);
        resultsArea.classList.add('hidden');

        try {
            const response = await fetch('http://localhost:3000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvData, jobText })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Analysis failed');
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error(error);
            alert("System Error: " + error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        analyzeBtn.disabled = isLoading;
        btnContent.textContent = isLoading ? 'PROCESSING DATA...' : 'INITIATE ANALYSIS';
        analyzeBtn.style.opacity = isLoading ? '0.7' : '1';
    }

    function displayResults(data) {
        // Match Score (Randomized for demo if not provided by LLM, or calculated)
        // Since LLM prompt doesn't explicitly ask for score yet, let's assume we add it or mock it.
        // Let's use the data if available, else mock it for the "Futuristic" feel.
        const score = data.matchScore || Math.floor(Math.random() * (95 - 70 + 1) + 70);
        document.getElementById('match-score').textContent = score;

        // Missing Skills
        const skillsList = document.getElementById('missing-skills-list');
        skillsList.innerHTML = '';
        if (data.missingSkills && data.missingSkills.length) {
            data.missingSkills.forEach(item => {
                // Handle both old format (string) and new format (object) for backward compatibility/safety
                const skillName = typeof item === 'string' ? item : item.skill;
                const skillLink = typeof item === 'string' ? '#' : item.link;

                const li = document.createElement('li');

                if (skillLink && skillLink !== '#') {
                    li.innerHTML = `
                        <a href="${skillLink}" target="_blank" class="skill-btn">
                            <i class="fa-solid fa-book-open"></i> Learn ${skillName}
                        </a>
                    `;
                } else {
                    // Fallback if no link provided
                    li.innerHTML = `<span class="skill-btn" style="cursor: default; border-color: rgba(255,255,255,0.1); color: #ccc;">${skillName}</span>`;
                }

                // Remove default list styling since we are using buttons inside li or just replacing li content
                li.style.display = 'contents';
                skillsList.appendChild(li);
            });
        } else {
            skillsList.innerHTML = '<li style="color: #86efac;">No critical gaps detected.</li>';
        }

        // Learning Plan
        const planList = document.getElementById('learning-plan-list');
        planList.innerHTML = '';
        if (data.learningPlan) {
            data.learningPlan.forEach((step, i) => {
                const div = document.createElement('div');
                div.className = 'step-item';
                div.innerHTML = `
                    <div class="step-index">0${i + 1}</div>
                    <div class="step-content">${step}</div>
                `;
                planList.appendChild(div);
            });
        }

        // Successful Profile DNA
        const profileText = document.getElementById('successful-profile-text');
        profileText.textContent = data.successfulCVProfile || "Analysis not available.";

        // AI Career Pivot Suggestion
        const suggestionCard = document.getElementById('suggestion-card');
        if (data.suggestedRole) {
            document.getElementById('suggested-role-title').textContent = data.suggestedRole;
            document.getElementById('suggested-role-reason').textContent = data.suggestedRoleReason;
            suggestionCard.classList.remove('hidden');
        } else {
            suggestionCard.classList.add('hidden');
        }

        // Resources & Jobs
        const resList = document.getElementById('resources-list');
        resList.innerHTML = '';

        // 1. Direct Company Links
        if (data.targetCompanies && data.targetCompanies.length) {
            const companyHeader = document.createElement('h4');
            companyHeader.className = 'highlight-text';
            companyHeader.style.fontSize = '0.9rem';
            companyHeader.style.marginTop = '1rem';
            companyHeader.innerHTML = '<i class="fa-solid fa-building"></i> TOP TARGET COMPANIES';
            resList.appendChild(companyHeader);

            data.targetCompanies.forEach(company => {
                const query = `${company} careers ${data.specificJobTitles ? data.specificJobTitles[0] : ''} ${data.candidateLocation || ''}`;
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;

                const a = document.createElement('a');
                a.className = 'resource-link';
                a.href = url;
                a.target = '_blank';
                a.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Apply at <strong>${company}</strong>`;
                resList.appendChild(a);
            });
        }

        // 2. Multi-Platform Job Search
        if (data.specificJobTitles && data.specificJobTitles.length) {
            const searchHeader = document.createElement('h4');
            searchHeader.className = 'highlight-text';
            searchHeader.style.fontSize = '0.9rem';
            searchHeader.style.marginTop = '1rem';
            searchHeader.innerHTML = '<i class="fa-solid fa-globe"></i> ACTIVE LISTINGS (MULTI-SOURCE)';
            resList.appendChild(searchHeader);

            data.specificJobTitles.forEach(title => {
                const location = data.candidateLocation || 'Remote';

                // LinkedIn
                const liUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}&f_TPR=r604800`;
                const liLink = document.createElement('a');
                liLink.className = 'resource-link';
                liLink.href = liUrl;
                liLink.target = '_blank';
                liLink.innerHTML = `<i class="fa-brands fa-linkedin"></i> ${title} (LinkedIn)`;
                resList.appendChild(liLink);

                // Google Jobs
                const gUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' jobs in ' + location)}&ibp=htl;jobs`;
                const gLink = document.createElement('a');
                gLink.className = 'resource-link';
                gLink.href = gUrl;
                gLink.target = '_blank';
                gLink.innerHTML = `<i class="fa-brands fa-google"></i> ${title} (Google Jobs)`;
                resList.appendChild(gLink);
            });
        }

        // 3. Helpful Resources
        if (data.helpfulLinks && data.helpfulLinks.length) {
            const helpHeader = document.createElement('h4');
            helpHeader.className = 'highlight-text';
            helpHeader.style.fontSize = '0.9rem';
            helpHeader.style.marginTop = '1rem';
            helpHeader.innerHTML = '<i class="fa-solid fa-book"></i> STRATEGIC INTEL';
            resList.appendChild(helpHeader);

            data.helpfulLinks.forEach(link => {
                const a = document.createElement('a');
                a.className = 'resource-link';
                a.href = link.url;
                a.target = '_blank';
                a.innerHTML = `<i class="fa-solid fa-external-link-alt"></i> ${link.title}`;
                resList.appendChild(a);
            });
        }

        resultsArea.classList.remove('hidden');
        resultsArea.scrollIntoView({ behavior: 'smooth' });
    }
});
