# Contributing to Horizon

Thank you for your interest in contributing to Horizon! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm package manager
- Git
- MetaMask wallet
- Basic understanding of React, TypeScript, and Web3

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/horizon.git
   cd horizon
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

## 📋 How to Contribute

### **Reporting Issues**
- Use the GitHub issue tracker
- Provide clear reproduction steps
- Include environment details (OS, Node version, etc.)
- Use appropriate labels

### **Feature Requests**
- Open a GitHub issue with the "enhancement" label
- Describe the feature and its benefits
- Consider implementation complexity
- Discuss with maintainers before starting

### **Bug Fixes**
- Check existing issues first
- Create a new issue if not found
- Fork the repository
- Create a feature branch
- Make your changes
- Add tests if applicable
- Submit a pull request

### **New Features**
- Discuss in GitHub issues first
- Create a detailed proposal
- Get approval from maintainers
- Follow the development workflow

## 🔄 Development Workflow

### **Branch Naming**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### **Commit Messages**
Use conventional commits format:
```
type(scope): description

feat(ui): add dark mode toggle
fix(contracts): resolve USDC approval issue
docs(readme): update installation instructions
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### **Pull Request Process**

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code style
   - Add tests for new features

3. **Test your changes**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues
   - Request reviews from maintainers

## 📝 Code Standards

### **TypeScript**
- Use strict type checking
- Avoid `any` types
- Use proper interfaces and types
- Document complex types

### **React**
- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement error boundaries

### **Styling**
- Use Tailwind CSS classes
- Follow mobile-first approach
- Maintain consistent spacing
- Use semantic HTML

### **Web3**
- Handle loading and error states
- Implement proper error handling
- Use wagmi hooks correctly
- Follow security best practices

## 🧪 Testing

### **Unit Tests**
- Test individual functions and components
- Use Jest and React Testing Library
- Aim for good coverage
- Test edge cases

### **Integration Tests**
- Test component interactions
- Test Web3 integrations
- Test user workflows
- Test error scenarios

### **E2E Tests**
- Test complete user journeys
- Test on different devices
- Test with different wallets
- Test error handling

## 📚 Documentation

### **Code Documentation**
- Add JSDoc comments for functions
- Document complex logic
- Explain Web3 interactions
- Update README when needed

### **API Documentation**
- Document contract interactions
- Explain data flow
- Provide examples
- Keep up to date

## 🎨 Design Guidelines

### **UI/UX**
- Follow the design system
- Maintain consistency
- Consider accessibility
- Test on mobile devices

### **Animations**
- Use subtle, purposeful animations
- Consider performance
- Test on different devices
- Follow Apple-inspired design

## 🔒 Security

### **Smart Contracts**
- Follow security best practices
- Test thoroughly
- Consider edge cases
- Review with security experts

### **Frontend Security**
- Validate user inputs
- Handle errors gracefully
- Use secure practices
- Avoid XSS vulnerabilities

## 🚀 Deployment

### **Environment Setup**
- Use environment variables
- Configure for different networks
- Set up proper monitoring
- Follow deployment best practices

### **Testing on Mainnet**
- Use testnet first
- Test with small amounts
- Monitor gas usage
- Have rollback plans

## 📞 Getting Help

### **Discord/Slack**
- Join our community channels
- Ask questions in appropriate channels
- Help other contributors
- Share knowledge

### **GitHub Discussions**
- Use for general questions
- Share ideas and feedback
- Discuss roadmap
- Get community input

### **Code Reviews**
- Be constructive and helpful
- Focus on code quality
- Suggest improvements
- Learn from feedback

## 🏆 Recognition

### **Contributors**
- All contributors are recognized
- Significant contributions get special mention
- Regular contributors may become maintainers
- We value all types of contributions

### **Types of Contributions**
- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Community help
- Testing and QA

## 📋 Checklist

Before submitting a PR, ensure:
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility considered
- [ ] Security reviewed
- [ ] Performance tested

## 🤝 Code of Conduct

### **Our Pledge**
We are committed to providing a welcoming and inclusive environment for all contributors.

### **Expected Behavior**
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow community guidelines

### **Unacceptable Behavior**
- Harassment or discrimination
- Inappropriate language
- Spam or off-topic content
- Violation of community standards

## 📞 Contact

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: [Your email here]
- **Discord**: [Your Discord server]

---

Thank you for contributing to Horizon! Together, we're building the future of decentralized prediction markets.

**Happy coding! 🚀**
